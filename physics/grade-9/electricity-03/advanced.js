'use strict';
const AdvancedCircuits=(()=>{
 const C={ink:'#18343f',teal:'#096f70',orange:'#a04c14'},H=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const edge=(id,a,b,type,points,extra={})=>({id,a,b,type,points,...extra});
 const P=(...pairs)=>pairs.map(p=>p.split(',').map(Number));
 function parallel({count=2,main=false,branchSwitch=false,switchThird=false,branchMeters=false,volts=false,open='',short='',res=[10,20,30],wrongA=false,combo=false}={}){
  const e=[],rows=[105,180,255],add=x=>e.push(x);let previous='P';
  if(main){add(edge('S₀','P','M','switch',P('100,350','100,315')));previous='M';}
  add(edge('A₀',previous,'B','ammeter',P(`100,${main?315:350}`,'100,270'),{measure:'total'}));
  add(edge('左母线','B','BT','wire',P('100,270','100,75')));
  add(edge('右母线','RT','N','wire',P('650,75','650,350')));
  for(let i=0;i<count;i++){
   const k=i+1,y=rows[i],a='b'+k+'a',b='b'+k+'b',c='b'+k+'c';
   add(edge('导线'+k+'a','BT',a,'wire',P(`100,75`,`100,${y}`,`205,${y}`)));
   add(edge('S'+k,a,b,branchSwitch&&(i<2||switchThird)?'switch':'wire',P(`205,${y}`,`275,${y}`)));
   add(edge(combo&&i===2?'R₀':'A'+k,b,c,combo&&i===2?'resistor':branchMeters||i===0&&main?'ammeter':'wire',P(`275,${y}`,`345,${y}`),{measure:'L'+k,r:10}));
   add(edge('L'+k,c,'b'+k+'d',open==='L'+k?'open':'lamp',P(`345,${y}`,`520,${y}`),{r:res[i]}));
   add(edge('导线'+k+'b','b'+k+'d','RT','wire',P(`520,${y}`,`650,${y}`,`650,75`)));
  }
  if(combo){add(edge('S3','b3c','b3d','switch',P('345,255','345,305','520,305','520,255'),{at:[430,305]}));add(edge('S4','P','N','switch',P('100,350','55,350','55,390','695,390','695,350','650,350'),{at:[375,390]}));}
  if(volts){add(edge('V₁','b1c','b1d','voltmeter',P('345,105','345,45','520,45','520,105'),{at:[432,45],positive:'b1c',measure:'L1'}));add(edge('V₂','BT','RT','voltmeter',P('100,75','100,20','650,20','650,75'),{at:[585,20],positive:'BT',measure:'bus'}));}
  if(short==='source'||wrongA)add(edge(wrongA?'A错':'危险短接','P','N',wrongA?'ammeter':'wire',P('100,350','55,350','55,390','695,390','695,350','650,350'),wrongA?{at:[375,390],measure:'source'}:{}));
  return {edges:e,U:6,labels:{B:[100,75],N:[650,75]},kind:'parallel',count,warning:short==='source'||wrongA};
 }
 function series({count=2,open='',short='',volts=false,ammeter=true,rheostat=false,reverse='',voltageSeries=false,switchOpen=false}={}){
  const e=[],xs=count===3?[100,255,410,650]:[100,360,650],y=180;let prev='P';
  e.push(edge('左导线','P','A','wire',P('100,350','100,180')));prev='A';
  if(ammeter){e.push(edge('A₀',prev,'A0','ammeter',P('100,180','155,180'),{measure:'total',reverse:reverse==='A₀'}));prev='A0';}
  for(let i=0;i<count;i++){
   const a=prev,b=i===count-1?'Z':'n'+(i+1),x1=i===0&&ammeter?155:xs[i],x2=xs[i+1],id='L'+(i+1);
   e.push(edge(id,a,b,open===id?'open':rheostat&&i===count-1?'rheostat':'lamp',P(`${x1},180`,`${x2},180`),{r:rheostat&&i===count-1?10:[10,20,30][i]}));
   if(short===id)e.push(edge('旁路线',a,b,'wire',P(`${x1},180`,`${x1},270`,`${x2},270`,`${x2},180`)));
   prev=b;
  }
  e.push(edge('右导线','Z','N','wire',P('650,180','650,350')));
  if(short==='source')e.push(edge('危险短接','P','N','wire',P('100,350','100,55','650,55','650,350')));
  if(volts){e.push(edge('V₁',ammeter?'A0':'A','n1','voltmeter',P(`${ammeter?155:100},180`,`${ammeter?155:100},95`,`${xs[1]},95`,`${xs[1]},180`),{at:[210,95],positive:ammeter?'A0':'A',measure:'L1',reverse:reverse==='V₁'}));
   e.push(edge('V₂','n1','Z','voltmeter',P(`${xs[1]},180`,`${xs[1]},270`,'650,270','650,180'),{at:[520,270],positive:'n1',measure:count===3?'L2+L3':'L2'}));
   if(count===3)e.push(edge('V₃',ammeter?'A0':'A','Z','voltmeter',P(`${ammeter?155:100},180`,`${ammeter?155:100},35`,'650,35','650,180'),{at:[585,35],positive:ammeter?'A0':'A',measure:'L1+L2+L3'}));
  }
  if(voltageSeries){const w=e.find(x=>x.id==='左导线');w.type='voltmeter';w.id='V错';w.at=[100,260];w.positive='P';}
  if(switchOpen){const w=e.find(x=>x.id==='左导线');w.type='switch';w.id='S';}
  return {edges:e,U:6,labels:{A:[100,180],...(count===3?{'B':[255,180],'C':[410,180]}:{}),D:[650,180]},kind:'series',count,warning:short==='source',switches:switchOpen?{S:false}:{}};
 }
 function solve(net,sw={}){
  const parent={};const find=x=>{parent[x]??=x;return parent[x]===x?x:parent[x]=find(parent[x]);},join=(a,b)=>{parent[find(a)]=find(b);};
  for(const e of net.edges){find(e.a);find(e.b);if(e.type==='wire'||e.type==='ammeter'||e.type==='switch'&&sw[e.id]!==false)join(e.a,e.b);}
  const pos=find('P'),neg=find('N');if(pos===neg)return {sourceShort:true,voltage:{},current:{},lit:{},meter:{},total:null};
  const loads=net.edges.filter(e=>['lamp','rheostat','resistor'].includes(e.type)),roots=[...new Set(Object.keys(parent).map(find))],unknown=roots.filter(x=>x!==pos&&x!==neg),fixed={[pos]:net.U,[neg]:0};
  const a=unknown.map(()=>Array(unknown.length+1).fill(0));
  for(const e of loads){const u=find(e.a),v=find(e.b);if(u===v)continue;const g=1/e.r;for(const [x,z]of [[u,v],[v,u]]){const i=unknown.indexOf(x);if(i<0)continue;a[i][i]+=g;const j=unknown.indexOf(z);if(j>=0)a[i][j]-=g;else a[i][unknown.length]+=g*fixed[z];}}
  for(let i=0;i<unknown.length;i++){let pivot=i;for(let j=i+1;j<unknown.length;j++)if(Math.abs(a[j][i])>Math.abs(a[pivot][i]))pivot=j;if(Math.abs(a[pivot][i])<1e-10){a[i][i]=1;a[i][unknown.length]=0;continue;}[a[i],a[pivot]]=[a[pivot],a[i]];const d=a[i][i];for(let k=i;k<=unknown.length;k++)a[i][k]/=d;for(let j=0;j<unknown.length;j++)if(j!==i){const t=a[j][i];for(let k=i;k<=unknown.length;k++)a[j][k]-=t*a[i][k];}}
  const voltage={...fixed};unknown.forEach((x,i)=>voltage[x]=a[i][unknown.length]);
  const current={},lit={};for(const e of loads){current[e.id]=(voltage[find(e.a)]-voltage[find(e.b)])/e.r;lit[e.id]=Math.abs(current[e.id])>1e-6;}
  const total=loads.reduce((n,e)=>n+(find(e.a)===pos?current[e.id]:find(e.b)===pos?-current[e.id]:0),0);
  const meter={};for(const e of net.edges)if(e.type==='voltmeter')meter[e.id]=(voltage[find(e.reverse?e.b:e.positive||e.a)]-voltage[find(e.reverse?e.positive||e.a:e.b)]);else if(e.type==='ammeter')meter[e.id]=e.measure==='total'?total:current[e.measure]||0;
  return {sourceShort:false,voltage,current,lit,meter,total,roots:Object.fromEntries(Object.keys(parent).map(x=>[x,find(x)]))};
 }
 const point=([x,y])=>`${x},${y}`,poly=(pts,color=C.ink,width=3,extra='')=>`<polyline points="${pts.map(point).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" ${extra}/>`;
 const t=(x,y,s,size=21,color=C.ink)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${color}">${H(s)}</text>`;
 function symbol(e,physical=false){const ps=e.points,at=e.at||[(ps[0][0]+ps.at(-1)[0])/2,(ps[0][1]+ps.at(-1)[1])/2],x=at[0],y=at[1],v=ps[0][0]===ps.at(-1)[0],id=H(e.id);let g='';
  if(e.type==='switch'){g=v?`<circle cx="${x}" cy="${y-22}" r="4"/><circle cx="${x}" cy="${y+22}" r="4"/><path d="M${x} ${y-22}L${x+(e.closed===false?20:0)} ${y+22}" fill="none" stroke="${C.ink}" stroke-width="3"/>`:`<circle cx="${x-22}" cy="${y}" r="4"/><circle cx="${x+22}" cy="${y}" r="4"/><path d="M${x-22} ${y}L${x+22} ${y+(e.closed===false?-20:0)}" fill="none" stroke="${C.ink}" stroke-width="3"/>`;if(physical)g=`<rect x="${x-29}" y="${y-24}" width="58" height="48" rx="7" fill="#fff4e9" stroke="${C.ink}" stroke-width="2"/>`+g;}
  else if(e.type==='lamp'||e.type==='open'){g=`<circle cx="${x}" cy="${y}" r="25" fill="${physical?'#fff3d2':'white'}" stroke="${C.ink}" stroke-width="3"/>${e.type==='open'?`${poly([[x-16,y-14],[x-5,y-3]],C.orange,3)}${poly([[x+5,y+3],[x+16,y+14]],C.orange,3)}${t(x,y+7,'×',19,C.orange)}`:poly([[x-16,y-16],[x+16,y+16]])+poly([[x-16,y+16],[x+16,y-16]])}`;}
  else if(e.type==='rheostat'||e.type==='resistor')g=`<rect x="${x-32}" y="${y-15}" width="64" height="30" fill="${physical?'#fff4e9':'white'}" stroke="${C.ink}" stroke-width="3"/>${e.type==='rheostat'?`<path d="M${x+18} ${y-34}L${x-5} ${y+8}m0 0l-2 -13m2 13l13 -3" fill="none" stroke="${C.orange}" stroke-width="3"/>${physical?`<circle cx="${x-24}" cy="${y+22}" r="4"/><circle cx="${x+24}" cy="${y-22}" r="4"/>`:''}${t(x,y+55,e.terminal==='CD'?'C/D 错接':'A/C 接线',17)}`:''}`;
  else if(e.type==='ammeter'||e.type==='voltmeter'){g=`${physical?`<rect x="${x-31}" y="${y-29}" width="62" height="58" rx="6" fill="#edf7f5" stroke="${C.ink}" stroke-width="2"/>`:''}<circle cx="${x}" cy="${y}" r="${physical?18:25}" fill="white" stroke="${C.ink}" stroke-width="3"/>${t(x,y+8,e.type==='ammeter'?'A':'V',24)}${v?t(x,y+(ps[0][1]>ps.at(-1)[1]?43:-36),e.reverse?'−':'+',18,C.orange)+t(x,y+(ps[0][1]>ps.at(-1)[1]?-36:43),e.reverse?'+':'−',18,C.orange):t(x-34,y-17,e.reverse?'−':'+',18,C.orange)+t(x+34,y-17,e.reverse?'+':'−',18,C.orange)}`;}
  return `<g data-component="${id}" data-action="ac:inspect" data-value="${id}" style="cursor:pointer" fill="${C.ink}">${g}${t(x+(v?49:0),y+(v?6:-33),id,19)}${e.range?t(x+(v?55:0),y+(v?29:52),'0—'+e.range+' A',15,C.orange):''}<title>${id}：点击查看连接节点</title></g>`;
 }
 function draw(net,result,{q=0,selected='',physical=false,visible=Infinity,guess='',fixed=false}={}){
  const warning=result.sourceShort||net.warning;let g=`<svg viewBox="0 0 760 400" role="img" aria-label="${physical?'实物接线示意':'规范电路图'}，6伏低压理想模型">`;
  g+=physical?`<rect x="300" y="326" width="100" height="46" rx="8" fill="#edf7f5" stroke="${C.ink}" stroke-width="3"/>${t(350,355,'电源 6 V',18)}${t(295,352,'+',23,C.orange)}${t(405,352,'−',23,C.orange)}`:`${poly([[100,350],[326,350]])}<path d="M326 324V376M348 335V365" stroke="${C.ink}" stroke-width="4"/>${poly([[348,350],[650,350]])}${t(315,322,'+',22,C.orange)}${t(363,323,'−',22,C.orange)}${t(430,380,'6 V',18)}`;
  if(physical){g+=poly([[100,350],[300,350]],'#527c9e')+poly([[400,350],[650,350]],'#527c9e');}
  for(const [i,e]of net.edges.entries()){
   const show=i<visible,inspect=e.id===selected,branch=e.id.match(/[1-3]/)?.[0],pathCurrent=branch?result.current['L'+branch]:result.total,active=!result.sourceShort&&Math.abs(pathCurrent||0)>1e-6&&(!selected||selected==='A₀'||selected==='V₂'||selected==='V₃'||selected.endsWith(branch||'!'));
   if(e.type==='switch')e.closed=undefined;
   const isSwitch=e.type==='switch',closed=isSwitch?(net.switches?.[e.id]!==false):true;
   const e2=isSwitch?{...e,closed}:e;
   const color=q>=2&&(inspect||active)?C.teal:guess===e.id&&!fixed?C.orange:C.ink;
   if(show){if(e.type==='wire')g+=poly(e.points,color,q>=2&&active?5:3,q>=2&&active?'class="ac-flow"':'');else{
    const pts=e.points,at=e.at||[(pts[0][0]+pts.at(-1)[0])/2,(pts[0][1]+pts.at(-1)[1])/2],first=pts[0],last=pts.at(-1),v=first[0]===last[0],radius=26,before=v?[at[0],at[1]+(first[1]<last[1]?-radius:radius)]:[at[0]+(first[0]<last[0]?-radius:radius),at[1]],after=v?[at[0],at[1]+(first[1]<last[1]?radius:-radius)]:[at[0]+(first[0]<last[0]?radius:-radius),at[1]];
    const k=Math.max(0,pts.findIndex((p,j)=>j<pts.length-1&&(v?p[0]===at[0]&&pts[j+1][0]===at[0]:p[1]===at[1]&&pts[j+1][1]===at[1])));g+=poly([...pts.slice(0,k+1),before],color,q>=2&&active?5:3,q>=2&&active?'class="ac-flow"':'')+poly([after,...pts.slice(k+1)],color,q>=2&&active?5:3,q>=2&&active?'class="ac-flow"':'')+symbol(e2,physical);
   }}else if(e.type!=='wire')g+=symbol(e2,physical);
   if(q>=2&&show&&active&&e.type==='lamp'&&result.lit[e.id])g+=`<circle cx="${(e.points[0][0]+e.points.at(-1)[0])/2}" cy="${(e.points[0][1]+e.points.at(-1)[1])/2}" r="31" fill="none" stroke="${C.teal}" stroke-width="3" class="ac-pulse"/>`;
  }
  if(q>=1)for(const [name,[x,y]]of Object.entries(net.labels||{}))g+=`<circle cx="${x}" cy="${y}" r="5" fill="${C.teal}"/>${t(x+(x<350?-25:25),y-12,name,19,C.teal)}`;
  if(warning)g+=`<rect x="175" y="302" width="410" height="32" rx="6" fill="#fff4e9"/>${t(380,325,'危险：电源短路，仅屏幕模拟，禁止实物接线',19,C.orange)}`;
  return g+'</svg>';
 }
 const intro=(title,question,steps,config,extra={})=>({title,question,steps,scene:'advanced-circuit',config,teacher:'原创模拟题；先让学生独立标节点和预测，再点击元件或逐步揭示。电源6 V，灯泡按定值电阻代替，仅判断连接与理想读数。电源短路只作屏幕模拟，不得实物操作。',...extra});
 const pages=[
  intro('三只电流表分别测哪一段？','双灯并联：A₀、A₁、A₂ 各测哪里？',['点击电流表，标出所在支路。','沿节点 B 到 N 找完整路径。','核对：I总＝I₁＋I₂。'],'parallel2'),
  intro('电压表跨接哪两个节点？','先标正负，再沿导线找端点；V₂跨几个灯？',['点击 V，辨认正负接线柱。','沿导线标 A、B、C、D，确定跨接段。','V₂跨 L₂ 与 L₃；V₃测三灯总电压。'],'voltage3'),
  intro('三个开关改变哪些电表示数？','先预测：S₀、S₁、S₂各控制哪条路径？',['逐个切换开关，找有效节点与支路。','点击 A₀、A₁、V₁、V₂，检查连接端点。','由同一节点图计算理想读数，区分测量对象与读数变化。'],'parallel3'),
  intro('串联灯丝断开，两灯怎样？','L₂灯丝断开，L₁还能发光吗？',['沿整条串联回路找断点。','一处断路使全路没有电流。','若V跨断点，可能接近电源电压；完好灯两端近零。'],'seriesOpen'),
  intro('三条并联支路，断一路怎样？','断开 L₂ 支路后，另两路是否工作？',['先切断一条支路。','沿 B—N 节点找另两条完整路径。','理想恒压源下另两灯仍工作；总电流改变。'],'parallelOpen'),
  intro('用电器被导线旁路时怎样？','L₂被短接，L₁和电源怎样？',['导线使 L₂两端成为同一节点。','L₂无电流，L₁仍与电源形成回路。','L₁限制电流；不能误判为电源短路。'],'localShort'),
  intro('相同电路比较三种状态','通路、开路、局部短路与电源短路有何不同？',['切换状态并预测电流路径。','标出两端同节点的元件。','电源短路无有限理想读数，只作危险示意。'],'stateCompare'),
  intro('多开关复杂电路先排除什么？','三灯与三个开关：先查电源短路还是支路断路？',['切换 S₀、S₁、S₂，重新标 B、N。','高亮仍闭合的支路与短接路径。','根据节点和开关状态判断灯与电表。'],'switchCombo'),
  ...[
   ['串联实物图怎样画成电路图？','series2','physical'],['双灯并联如何互画？','parallel2','schematic'],['含 A、V 的电路怎样互画？','seriesMeter','physical'],['滑动变阻器的接线怎样核对？','rheostat','schematic'],['多开关多电表怎样互画？','parallel3','physical']
  ].map(([title,config,from])=>intro(title,'先预测下一根导线，再点“连接下一根线”。',['识别元件与电源正负极。','沿导线找分流点、汇合点；逐根连接。','对照两图：每根线与电表端点必须相同。'],config,{task:'convert',from})),
  intro('错图诊断：电表接法','电流表并联、电压表串联、正负接反、量程不当各会怎样？',['先选错误类型，点击怀疑位置。','根据电表内阻及正负柱分析后果。','点击改线，比对改前改后的真实连接。'],'meterErrors',{task:'error',cases:['ammeterParallel','voltmeterSeries','reverse','range']}),
  intro('错图诊断：控制与连接','开关位置、变阻器接线、并联误接串联怎样改？',['逐题观察连接节点，不凭图形远近判断。','指出一根必须改动的导线或接线柱。','改后核对独立控制与一上一下接法。'],'wiringErrors',{task:'error',cases:['switchPlace','rheostatWrong','seriesInstead']}),
  intro('错图诊断：两种短路及复合错误','先判断局部短路，还是电源短路？',['找直接连通两端的导线。','指出被旁路元件或危险电源短路。','改线后重算有效回路；复合错误需逐项改。'],'shortErrors',{task:'error',cases:['lampShort','sourceShort','multiError']}),
  intro('综合改错一：只改一根线','要求 V 测 L₂，不移动元件，只许移动一根导线的一端。',['先点击 V 的端点，确定原来测量对象。','把 V 正端从 L₁左侧改接到 L₂左侧。','检查 V 两端现在分别连在 L₂的两端。'],'oneMove',{task:'error',cases:['oneMove']}),
  intro('综合改错二：只删一根线','两灯串联且都工作；只许删除旁路线。',['先看 L₂两端是否同节点。','删除唯一的旁路线，不添加别的线。','改后两灯串联且电源未短路。'],'oneDelete',{task:'error',cases:['oneDelete']}),
  intro('综合改错三：多电表多开关','保留所有元件；允许移动两根导线，交叉处无点不连接。',['标出总开关与各支路开关。','检查 A 不跨接电源、V 不串入回路。','逐根移动并核对两电表的对象与有效支路。'],'multiFix',{task:'error',cases:['multiFix']}),
  intro('故障一：串联断点与两个电表','A＝0，跨 L₂的 V≈6 V，可能哪里断了？',['先给出 L₂断路的假设。','电压表高内阻跨接断点，形成近似零电流回路。','完好 L₁压降近零；该结论依赖本图连接条件。'],'faultSeries',{task:'fault'}),
  intro('故障二：并联某支路断了','A₀变小、A₁不变，哪条支路可能断？',['先给出 L₂支路断路假设。','标 B、N；L₁仍跨理想恒压源。','A₁不变，干路 A₀减少 L₂原来的电流。'],'faultParallel',{task:'fault'}),
  intro('故障三：短路与零示数辨析','A无示数或 V无示数，能否直接断言故障？',['切换断路、短路、总开关断开等假设。','逐项核对两只表的端点和有效回路。','同一零示数可有多种原因；第七章继续分析滑片与安全范围。'],'faultCompare',{task:'fault',teacher:'本页把第三章的连接、通断基础交给第七章动态分析使用：先确定有效回路与电表接点，后续再讨论滑片、安全范围。电压表跨断点接近电源电压只适用于本图条件；本题为原创模拟题。'})
 ];
 window.LESSON.pages.push(...pages);
 function initial(p){return {acCase:0,selected:'',guess:'',fixed:false,wireCount:0,switches:{'S₀':true,S1:true,S2:p.config==='parallelOpen'?false:true,S3:p.config==='parallelOpen',S4:false}};}
 function make(p,s){const cfg=p.config,chosen=p.cases?.[s.acCase]||cfg,fix=s.fixed;
  if(['parallel2','parallel3','parallelOpen','switchCombo','faultParallel'].includes(cfg)){
   const net=parallel({count:['parallel3','parallelOpen','switchCombo'].includes(cfg)?3:2,main:cfg!=='parallel2',branchSwitch:['parallel3','parallelOpen','switchCombo'].includes(cfg),switchThird:cfg==='parallelOpen',branchMeters:cfg==='parallel2',volts:['parallel3','switchCombo'].includes(cfg),open:cfg==='faultParallel'?'L2':'',combo:cfg==='switchCombo'});
   net.switches={...s.switches};return net;
  }
  if(cfg==='voltage3')return series({count:3,volts:true,ammeter:false});
  if(cfg==='seriesOpen'||cfg==='faultSeries')return series({open:'L2',volts:cfg==='faultSeries'});
  if(cfg==='localShort'||cfg==='oneDelete')return series({short:fix&&cfg==='oneDelete'?'':'L2'});
  if(cfg==='stateCompare'||cfg==='faultCompare')return series({switchOpen:s.acCase===1,open:s.acCase===2?'L2':'',short:s.acCase===3?'L2':s.acCase===4?'source':'',volts:cfg==='faultCompare'});
  if(cfg==='series2')return series({ammeter:false});
  if(cfg==='seriesMeter')return series({volts:true});
  if(cfg==='rheostat')return series({rheostat:true});
  if(p.task==='error'){
   if(chosen==='ammeterParallel'){const n=parallel({count:2,wrongA:!fix});if(fix){const a=n.edges.find(e=>e.id==='A2');a.id='A错';a.type='ammeter';a.measure='L2';}return n;}
   if(chosen==='voltmeterSeries'){const n=series({voltageSeries:!fix,volts:fix});if(fix){n.edges=n.edges.filter(e=>e.id!=='V₂');n.edges.find(e=>e.id==='V₁').id='V错';}return n;}
   if(chosen==='reverse')return series({volts:true,reverse:fix?'':'V₁'});
   if(chosen==='range'){const n=parallel({count:2});n.edges.find(e=>e.id==='A₀').range=fix?3:.6;return n;}
   if(chosen==='switchPlace'){const n=parallel({count:2,main:!fix,branchSwitch:fix});if(fix)n.edges.find(e=>e.id==='S2').type='wire';else n.edges.find(e=>e.id==='S₀').id='S1';n.switches={S1:false};return n;}
   if(chosen==='rheostatWrong'){const n=series({rheostat:true});const r=n.edges.find(e=>e.id==='L2');r.terminal=fix?'AC':'CD';r.r=fix?10:.001;return n;}
   if(chosen==='seriesInstead')return fix?parallel({count:2}):series({ammeter:false});
   if(chosen==='lampShort')return series({short:fix?'':'L2'});
   if(chosen==='sourceShort')return series({short:fix?'':'source'});
   if(chosen==='multiError')return series({short:fix?'':'L2',volts:true,reverse:fix?'':'V₁'});
   if(chosen==='oneMove'){const n=series({volts:true});n.edges=n.edges.filter(e=>e.id!=='V₂');const v=n.edges.find(e=>e.id==='V₁');v.a=fix?'n1':'A0';v.b='Z';v.positive=v.a;v.measure=fix?'L2':'L1+L2';v.points=P(`${fix?360:155},180`,`${fix?360:155},95`,'650,95','650,180');v.at=[520,95];return n;}
   if(chosen==='multiFix'){const n=parallel({count:3,main:true,branchSwitch:true,volts:true,wrongA:!fix});if(fix){const a=n.edges.find(e=>e.id==='A2');a.id='A错';a.type='ammeter';a.measure='L2';}return n;}
  }
  return series();
 }
 function action(s,k,value){if(k==='ac:inspect'){s.selected=value;s.guess=value;}else if(k==='ac:toggle'){s.switches[value]=!s.switches[value];}else if(k==='ac:fix')s.fixed=!s.fixed;else if(k==='ac:wire')s.wireCount++;else if(k==='ac:source')s.showTarget=!s.showTarget;else if(k==='ac:reset')Object.assign(s,{selected:'',guess:'',fixed:false,wireCount:0});}
 function render(p,s,q){const net=make(p,s),result=solve(net,net.switches),caseName=p.cases?.[s.acCase]||p.config,conversion=p.task==='convert',errors=p.task==='error',selected=s.selected,limit=conversion?Math.min(net.edges.length,s.wireCount):Infinity;
  let picture=draw(net,result,{q,selected,physical:conversion?(p.from==='physical'?!s.showTarget:!!s.showTarget):false,visible:conversion&&s.showTarget?limit:Infinity,guess:s.guess,fixed:s.fixed});
  if(errors&&s.fixed&&q>=2){const bad=make(p,{...s,fixed:false}),r0=solve(bad,bad.switches);picture=`<div class="ac-compare"><div><b>改前</b>${draw(bad,r0,{q:1})}</div><div><b>改后</b>${draw(net,result,{q:2})}</div></div>`;}
  let controls='';if(conversion)controls=`<button data-action="ac:source">${s.showTarget?'查看已知图':'切换到待绘图'}</button><button data-action="ac:wire">连接下一根线 ${Math.min(limit,net.edges.length)}/${net.edges.length}</button>`;
  else if(errors)controls=`<button data-action="ac:fix">${s.fixed?'恢复错图':'动态改线并对比'}</button>`;
  else if(['stateCompare','faultCompare'].includes(p.config))controls=`<label>电路状态 <select data-var="acCase">${['通路','总开关断开','L₂灯丝断路','L₂局部短路','电源短路（危险）'].map((x,i)=>`<option value="${i}" ${s.acCase===i?'selected':''}>${x}</option>`).join('')}</select></label>`;
  else if(net.edges.some(e=>e.type==='switch'))controls=net.edges.filter(e=>e.type==='switch').map(e=>`<button data-action="ac:toggle" data-value="${e.id}">${net.switches[e.id]===false?'闭合':'断开'} ${e.id==='S4'?'危险旁路线 S4（仅屏幕）':e.id}</button>`).join('');
  if(p.cases)controls=`<label>错图类型 <select data-var="acCase">${p.cases.map((x,i)=>`<option value="${i}" ${s.acCase===i?'selected':''}>${i+1}号原创模拟题</option>`).join('')}</select></label>`+controls;
  const meters=net.edges.filter(e=>['ammeter','voltmeter'].includes(e.type));const values=meters.map(e=>{const v=result.meter[e.id]??0;return `${e.id} ${result.sourceShort?'危险：不读数':e.range&&Math.abs(v)>e.range?'超量程':e.reverse?'反偏(理论'+v.toFixed(2)+(e.type==='ammeter'?' A':' V')+')':v.toFixed(2)+(e.type==='ammeter'?' A':' V')}`;}).join('　');
  let caption=q<1?'请先独立判断；点击元件可选中，再逐步显示节点。':q<3?'沿导线找连接点；蓝色高亮表示选中的元件或路径。':result.sourceShort?'危险：理想电源短路无有限电流值；仅屏幕模拟。':conversion?'实物接线示意与规范电路图使用同一组节点和导线数据。':errors?(s.fixed?'已显示改正后的连接；再次点击可比对原图。':'请先指出疑似错误，再点击动态改线。'):'读数是 6 V 理想直流模型计算值；灯泡以定值电阻近似。';
  if(errors&&q>=3){const explanations={
   ammeterParallel:'A错直接跨电源两极，近似电源短路；把表改串到指定支路。',voltmeterSeries:'V错串入主回路，理想情况下电流近零；应并接在被测两节点。',reverse:'V₁正负柱接反，指针式表反偏；交换其正负引线。',range:'干路 0.90 A 超过 0—0.6 A 量程；改用合适量程。',
   switchPlace:'总开关断开会使两灯都灭；要单独控制 L₁，应把开关移入 L₁支路。',rheostatWrong:'只接 C、D 两上端，接入电阻近零；改为 A、C 一上一下。',seriesInstead:'两灯依次相接，只有一路；题目要求两灯跨同一对节点并联。',
   lampShort:'旁路线把 L₂两端并成同一节点，L₂熄灭；断开这条线。',sourceShort:'导线直接接电源两极，危险；只作屏幕模拟，断开旁路。',multiError:'L₂被短接且 V₁反接；需分别恢复 L₂回路与电压表极性。',
   oneMove:'只移动 V₁正端从 L₁左端到 L₂左端，负端保持在 L₂右端；无连接点的交叉线不相连。',oneDelete:'只删除跨 L₂的旁路线，保留所有元件；两灯恢复串联。',multiFix:'保留三灯、三开关、两只电压表；把 A错的两根引线从电源两极移至 L₂前方断开的两个串联接点，交叉无点不相连。'
  };caption=(s.fixed?'改后：':'改前：')+explanations[caseName];}
  if(p.config==='faultSeries'&&q>=3)caption='L₂断路且 V₂跨断点、V内阻很大：A≈0，V₂≈6 V，完好 L₁两端近0 V；换接法不能套用。';
  if(p.config==='faultParallel'&&q>=3)caption='L₂断路：A₀仅剩L₁电流；L₁支路保持完整，理想恒压条件下 A₁不变。';
  if(p.config==='faultCompare'&&q>=3)caption=[
   '通路：两灯都有电流，先核对闭合回路。',
   '总开关断开：A＝0；本图两只 V 都跨在接向负极的负载段，均为 0。',
   'L₂断路：A≈0；跨断点的 V₂≈6 V，跨完好 L₁的 V₁≈0。',
   'L₂局部短路：A＝0.60 A；V₂＝0，L₁仍有完整回路。',
   '危险：直接短接电源；理想电流无有限值，禁止实物尝试。'
  ][s.acCase];
  if(p.config==='stateCompare'&&q>=3)caption=['通路：两灯有完整回路。','总开关断开：全路无电流。','L₂灯丝断路：串联全路无电流。','L₂局部短路：L₁仍工作，L₂无电流。','电源短路：危险；无有限理想电流值，禁止实物尝试。'][s.acCase];
  if(p.config==='rheostat'&&q>=3)caption='实物示意：滑动变阻器接 A、C（一上一下），接入电阻随滑片改变；CD 两上端近零电阻。';
  const metrics=q>=3?`<div class="readings"><span>电路状态<b>${result.sourceShort?'电源短路':result.total===0?'无电流':'有电流'}</b></span><span>干路电流<b>${result.sourceShort?'危险':result.total.toFixed(2)+' A'}</b></span>${meters.length?`<span>电表读数<b style="font-size:16px;white-space:normal">${values}</b></span>`:''}</div>`:'';
  return {picture,controls,metrics,caption,data:{...result,net,caseName,visibleCount:limit}};
 }
 return {initial,render,action,solve,parallel,series,make,pages};
})();
