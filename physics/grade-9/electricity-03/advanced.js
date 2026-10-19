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
  for(const e of net.edges){find(e.a);find(e.b);if(e.type==='wire'||e.type==='switch'&&sw[e.id]!==false)join(e.a,e.b);}
  // 电源短路判定：导线/闭合开关/电流表均视为理想导体（与原逻辑一致，单独并查集避免影响求解拓扑）
  const sp={},fp=x=>{sp[x]??=x;return sp[x]===x?x:sp[x]=fp(sp[x]);},jp=(a,b)=>{sp[fp(a)]=fp(b);};
  for(const e of net.edges){fp(e.a);fp(e.b);if(e.type==='wire'||e.type==='ammeter'||e.type==='switch'&&sw[e.id]!==false)jp(e.a,e.b);}
  const pos=find('P'),neg=find('N');if(fp('P')===fp('N'))return {sourceShort:true,voltage:{},current:{},lit:{},meter:{},total:null};
  const loads=net.edges.filter(e=>['lamp','rheostat','resistor'].includes(e.type));
  // 电流表用修正节点分析法（MNA）：电流作为显式未知量，加 V_X−V_Y=0 约束，
  // 按真实拓扑精确求出流经电流；不再使用 measure 标签指定读数，符合“电流表按实际所在路径识别电流”的要求。
  // 若两端已被导线连通（同一超节点），电流不定，记为 0。
  const shunts=net.edges.filter(e=>e.type==='ammeter'&&find(e.a)!==find(e.b));
  const roots=[...new Set(Object.keys(parent).map(find))],unknown=roots.filter(x=>x!==pos&&x!==neg),fixed={[pos]:net.U,[neg]:0};
  const NV=unknown.length,NS=shunts.length,NC=NV+NS;
  const a=Array.from({length:NC},()=>Array(NC+1).fill(0));
  for(const e of loads){const u=find(e.a),v=find(e.b);if(u===v)continue;const g=1/e.r;for(const [x,z]of [[u,v],[v,u]]){const i=unknown.indexOf(x);if(i<0)continue;a[i][i]+=g;const j=unknown.indexOf(z);if(j>=0)a[i][j]-=g;else a[i][NC]+=g*fixed[z];}}
  shunts.forEach((e,k)=>{
    const u=find(e.a),v=find(e.b),iu=unknown.indexOf(u),iv=unknown.indexOf(v),col=NV+k,row=NV+k;
    if(iu>=0)a[iu][col]+=1; // I 从 u 流向 v：u 的 KCL +I
    if(iv>=0)a[iv][col]-=1; // v 的 KCL −I
    if(iu>=0)a[row][iu]+=1;else a[row][NC]-=fixed[u]; // 约束 V_u−V_v=0（固定节点电压移到 RHS）
    if(iv>=0)a[row][iv]-=1;else a[row][NC]+=fixed[v];
  });
  for(let i=0;i<NC;i++){let pivot=i;for(let j=i+1;j<NC;j++)if(Math.abs(a[j][i])>Math.abs(a[pivot][i]))pivot=j;if(Math.abs(a[pivot][i])<1e-10){a[i][i]=1;a[i][NC]=0;continue;}[a[i],a[pivot]]=[a[pivot],a[i]];const d=a[i][i];for(let k=i;k<=NC;k++)a[i][k]/=d;for(let j=0;j<NC;j++)if(j!==i){const t=a[j][i];for(let k=i;k<=NC;k++)a[j][k]-=t*a[i][k];}}
  const voltage={...fixed};unknown.forEach((x,i)=>voltage[x]=a[i][NC]);
  const current={},lit={};for(const e of loads){current[e.id]=(voltage[find(e.a)]-voltage[find(e.b)])/e.r;lit[e.id]=Math.abs(current[e.id])>1e-6;}
  for(const e of net.edges)if(e.type==='ammeter'){const k=shunts.indexOf(e);current[e.id]=k<0?0:a[NV+k][NC];}
  // 干路电流：P 所在超节点的 KCL（电流表/负载电流均已按真实拓扑求出）
  let total=0;for(const e of net.edges){if(e.type!=='ammeter'&&!['lamp','rheostat','resistor'].includes(e.type))continue;const ia=find(e.a)===pos,ib=find(e.b)===pos;if(ia===ib)continue;total+=ia?current[e.id]:-current[e.id];}
  const meter={};for(const e of net.edges)if(e.type==='voltmeter')meter[e.id]=(voltage[find(e.reverse?e.b:e.positive||e.a)]-voltage[find(e.reverse?e.positive||e.a:e.b)]);else if(e.type==='ammeter')meter[e.id]=current[e.id]||0;
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
   if(show){if(e.type==='wire')g+=`<g data-action="ac:inspect" data-value="${H(e.id)}" style="cursor:pointer"><title>${H(e.id)}：点击选择这根导线</title>${poly(e.points,color,q>=2&&active?5:3,q>=2&&active?'class="ac-flow"':'')}</g>`;else{
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
 function initial(p){return {acCase:0,selected:'',guess:'',fixed:false,wireCount:0,
  wireMode:'student',showRef:true,userWires:[],pendingT:null,wireMsg:'',
  edits:[],pendingOp:null,editMsg:'',editOk:false,editDone:false,showStd:false,showParse:false,p29Pending:null,p29SelectedWire:null,p29Hint:0,p29Compare:false,
  switches:{'S₀':true,S1:true,S2:p.config==='parallelOpen'?false:true,S3:p.config==='parallelOpen',S4:false}};}
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
   if(chosen==='switchPlace'){const n=parallel({count:2,main:!fix,branchSwitch:fix});if(fix){n.edges.find(e=>e.id==='S2').type='wire';n.switches={S1:false};}else n.switches={'S₀':false};return n;}
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
 function action(s,k,value,p){
  if(k==='ac:inspect'){s.selected=value;s.guess=value;s.pendingOp=null;}
  else if(k==='ac:toggle'){s.switches[value]=!s.switches[value];}
  else if(k==='ac:wire'){s.wireCount++;}
  else if(k==='ac:source'){s.showTarget=!s.showTarget;}
  else if(k==='ac:showRef'){s.showRef=!s.showRef;}
  else if(k==='ac:wireMode'){const m=s.wireMode==='student'?'demo':'student';Object.assign(s,initial(p||{}),{wireMode:m,showRef:true});}
  else if(k==='ac:term'){actTerm(s,p||{},value);}
  else if(k==='ac:wireUndo'){s.userWires.pop();s.wireMsg='';}
  else if(k==='ac:wireReset'){s.userWires=[];s.pendingT=null;s.wireMsg='';}
  else if(k==='ac:editOp'){actEditOp(s,p||{},value);}
  else if(k==='ac:undoEdit'){(s.edits||[]).pop();s.editMsg='';s.editDone=false;s.editOk=false;s.showParse=false;s.p29Pending=null;s.p29SelectedWire=null;s.p29Compare=false;}
  else if(k==='ac:resetEdit'){s.edits=[];s.pendingOp=null;s.editMsg='';s.editDone=false;s.editOk=false;s.showStd=false;s.showParse=false;s.selected=null;s.p29Pending=null;s.p29SelectedWire=null;s.p29Hint=0;s.p29Compare=false;}
  else if(k==='ac:check'){actCheck(s,p||{});}
  else if(k==='ac:stdShow'){s.showStd=!s.showStd;}
  else if(k==='ac:parse'){s.showParse=!s.showParse;}
  else if(k==='ac:p29hint'){s.p29Hint=Math.min(2,s.p29Hint+1);}
  else if(k==='ac:p29delete'&&s.p29SelectedWire)p29Detach(s,p||{},s.p29SelectedWire.edge,s.p29SelectedWire.end);
  else if(k==='ac:p29compare'){s.p29Compare=!s.p29Compare;s.showStd=false;}
  else if(k==='ac:reset')Object.assign(s,initial(p||{}));
 }
 function render(p,s,q){
  // V3.1 整改：互画页学生模式走真实连线；改错页走真实改线
  if(p.task==='convert'&&s.wireMode==='student')return renderWiringPage(p,s,q);
  if(p.task==='error')return renderEditPage(p,s,q);
  const net=make(p,s),result=solve(net,net.switches),caseName=p.cases?.[s.acCase]||p.config,conversion=p.task==='convert',selected=s.selected,limit=conversion?Math.min(net.edges.length,s.wireCount):Infinity;
  let picture=draw(net,result,{q,selected,physical:conversion?(p.from==='physical'?!s.showTarget:!!s.showTarget):false,visible:conversion&&s.showTarget?limit:Infinity,guess:s.guess,fixed:s.fixed});
  let controls='';
  if(conversion)controls=`<button data-action="ac:source">${s.showTarget?'查看已知图':'切换到待绘图'}</button><button data-action="ac:wire">连接下一根线 ${Math.min(limit,net.edges.length)}/${net.edges.length}</button><button data-action="ac:wireMode">学生连线模式</button>`;
  else if(['stateCompare','faultCompare'].includes(p.config))controls=`<label>电路状态 <select data-var="acCase">${['通路','总开关断开','L₂灯丝断路','L₂局部短路','电源短路（危险）'].map((x,i)=>`<option value="${i}" ${s.acCase===i?'selected':''}>${x}</option>`).join('')}</select></label>`;
  else if(net.edges.some(e=>e.type==='switch'))controls=net.edges.filter(e=>e.type==='switch').map(e=>`<button data-action="ac:toggle" data-value="${e.id}">${net.switches[e.id]===false?'闭合':'断开'} ${e.id==='S4'?'危险旁路线 S4（仅屏幕）':e.id}</button>`).join('');
  const meters=net.edges.filter(e=>['ammeter','voltmeter'].includes(e.type));const values=meters.map(e=>{const v=result.meter[e.id]??0;return `${e.id} ${result.sourceShort?'危险：不读数':e.range&&Math.abs(v)>e.range?'超量程':e.reverse?'反偏(理论'+v.toFixed(2)+(e.type==='ammeter'?' A':' V')+')':v.toFixed(2)+(e.type==='ammeter'?' A':' V')}`;}).join('　');
  let caption=q<1?'请先独立判断；点击元件可选中，再逐步显示节点。':q<3?'沿导线找连接点；蓝色高亮表示选中的元件或路径。':result.sourceShort?'危险：理想电源短路无有限电流值；仅屏幕模拟。':conversion?'实物接线示意与规范电路图使用同一组节点和导线数据。':'读数是 6 V 理想直流模型计算值；灯泡以定值电阻近似。';
  // V3.1 整改：电表测量对象由拓扑推导（正负接线柱追到节点），选中电表且逐步显示到第2步时拼入说明
  if(selected&&q>=2){const dm=describeMeasure(net,result,selected);if(dm)caption+=' '+fmtMeasure(dm,selected);}
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
 /* ==================== V3.1 整改：真实交互连线与改错引擎 ====================
    原则：
    - 复用 solve() 节点求解；用户连线/改线落到真实 edge 数据并重新求解，视觉与模型一致。
    - 互画页（21–25）：学生在实物图上点选接线柱连线，逐根按节点校验，错误给原因，可撤销重连；保留教师演示模式。
    - 改错页（26–31）：选择导线/元件，移动端点、删除、交换表笔、换量程、改接线柱；按题限次；撤销；检查答案走真实物理校验；可对照标准改法。
    - 电表测量对象一律由拓扑推导，不依赖 measure 文案。 */

 const BAT={serP:[326,350],serN:[348,350],phyP:[300,350],phyN:[400,350]};
 const remapPt=(pt,physical)=>{
   if(pt[0]===100&&pt[1]===350)return physical?BAT.phyP:BAT.serP;
   if(pt[0]===650&&pt[1]===350)return physical?BAT.phyN:BAT.serN;
   return pt;
 };
 const pairKey=(a,b)=>[a,b].sort().join('|');
 // 终端：按坐标去重，记录逻辑节点
 function terminals(net,physical){
   const map=new Map();
   for(const e of net.edges){
     const ps=e.points;
     const ends=[[remapPt(ps[0],physical),e.a],[remapPt(ps[ps.length-1],physical),e.b]];
     for(const [pt,node] of ends){
       const k=pt[0]+','+pt[1];
       if(!map.has(k))map.set(k,{key:k,x:pt[0],y:pt[1],node,edgeIds:[]});
       const t=map.get(k);
       if(!t.edgeIds.includes(e.id))t.edgeIds.push(e.id);
     }
   }
   return [...map.values()];
 }
 function nodeCoords(net,physical){
   const m={};
   for(const t of terminals(net,physical))if(!(t.node in m))m[t.node]=[t.x,t.y];
   return m;
 }
 // 待连导线（按节点对，去重）
 function requiredWires(net,physical){
   const seen=new Set(),out=[];
   for(const e of net.edges){
     if(e.type!=='wire')continue;
     const ps=e.points,p1=remapPt(ps[0],physical),p2=remapPt(ps[ps.length-1],physical);
     if(p1[0]===p2[0]&&p1[1]===p2[1])continue;
     const k=pairKey(e.a,e.b);
     if(seen.has(k))continue;seen.add(k);
     out.push({edge:e.id,n1:e.a,n2:e.b});
   }
   return out;
 }
 // 基础导通并查集（不含待画导线），用于短路试算
 function unionBase(edges,sw){
   const p={},f=x=>{p[x]??=x;return p[x]===x?x:p[x]=f(p[x]);},j=(a,b)=>{p[f(a)]=f(b);};
   for(const e of edges){f(e.a);f(e.b);if(e.type==='ammeter'||e.type==='wire'||e.type==='switch'&&sw[e.id]!==false)j(e.a,e.b);}
   return {f,j};
 }
 function validateWire(net,physical,userWires,n1,n2){
   const req=requiredWires(net,physical);
   const done=new Set();
   for(const w of userWires)if(w.ok)done.add(pairKey(w.n1,w.n2));
   if(n1===n2)return {ok:false,push:false,reason:'起点和终点是同一个接线柱，请重新选择。'};
   const pk=pairKey(n1,n2);
   if(done.has(pk))return {ok:false,push:false,reason:'这根导线已经连好了，不需要重复连接。'};
   if(req.some(r=>pairKey(r.n1,r.n2)===pk))return {ok:true,push:true};
   const sw=net.switches||{};
   const uj=unionBase(net.edges.filter(e=>e.type!=='wire'),sw);
   for(const w of userWires)if(w.ok)uj.j(w.n1,w.n2);
   if(uj.f(n1)===uj.f(n2))return {ok:false,push:false,reason:'这两端已经通过其他导线连通，不需要再连。'};
   uj.j(n1,n2);
   if(uj.f('P')===uj.f('N'))return {ok:false,push:true,reason:'危险！这样连接会造成电源短路，绝对禁止这样接线。'};
   return {ok:false,push:true,reason:'这两点之间不需要直接连导线，请对照电路图再想一想。'};
 }
 // 实物接线画布（元件预置，只画导线与接线柱）
 function drawWiring(net,tm,userWires,pendingKey){
   const byKey={};for(const t of tm)byKey[t.key]=t;
   let g=`<svg viewBox="0 0 760 400" role="img" aria-label="实物接线画布：点击接线柱连接导线">`;
   g+=`<rect x="300" y="326" width="100" height="46" rx="8" fill="#edf7f5" stroke="${C.ink}" stroke-width="3"/>${t(350,355,'电源 6 V',18)}${t(283,352,'+',24,C.orange)}${t(417,352,'−',24,C.orange)}`;
   for(const e of net.edges){
     if(e.type==='wire')continue;
     const e2=e.type==='switch'?{...e,closed:net.switches?.[e.id]!==false}:e;
     g+=symbol(e2,true);
   }
   for(const w of userWires){
     const a=byKey[w.k1],b=byKey[w.k2];
     if(!a||!b)continue;
     g+=poly([[a.x,a.y],[b.x,b.y]],w.ok?C.teal:C.orange,4,w.ok?'':'stroke-dasharray="10 7"');
   }
   for(const tt of tm){
     const isP=tt.key===pendingKey;
     const done=userWires.some(w=>w.ok&&(w.k1===tt.key||w.k2===tt.key));
     g+=`<g data-action="ac:term" data-value="${tt.key}" style="cursor:pointer"><circle cx="${tt.x}" cy="${tt.y}" r="18" fill="rgba(0,0,0,0)"/><circle cx="${tt.x}" cy="${tt.y}" r="${isP?10:7}" fill="${isP?C.orange:done?'#b2d8cf':'#ffffff'}" stroke="${isP?C.orange:C.ink}" stroke-width="2.5"><title>接线柱：点击选择</title></circle></g>`;
   }
   return g+'</svg>';
 }
 // 改错规则：允许的操作、限次、提示
 const EDIT_RULES={
   ammeterParallel:{ops:['moveEnd'],max:4,hint:'把 A错 从电源两极移到 L2 支路中（替换该处导线）'},
   voltmeterSeries:{ops:['moveEnd'],max:4,hint:'把 V错 从干路移到与 L1 并联'},
   reverse:{ops:['swapMeter'],max:3,hint:'交换 V₁ 的正负接线柱'},
   range:{ops:['chRange'],max:3,hint:'把 A₀ 换到合适量程'},
   switchPlace:{ops:['moveEnd'],max:6,hint:'先把支路导线移到总路（与开关并联），再把开关移到 L1 支路'},
   rheostatWrong:{ops:['reterm'],max:3,hint:'变阻器改接为一上一下（A-C）'},
   seriesInstead:{ops:['moveEnd'],max:6,hint:'把两灯改接为并联（移动 L1、L2 的端点）'},
   lampShort:{ops:['delWire'],max:2,hint:'删除跨接 L2 的旁路线'},
   sourceShort:{ops:['delWire'],max:2,hint:'删除直接短接电源的导线'},
   multiError:{ops:['delWire','swapMeter'],max:5,hint:'先删除 L2 旁路线，再纠正 V₁ 极性'},
   oneMove:{ops:['moveEnd'],max:1,hint:'只移动 V₁ 正极引线的一端到 L2 左端'},
   oneDelete:{ops:['delWire'],max:1,hint:'只删除一根旁路线'},
   multiFix:{ops:['moveEnd'],max:2,hint:'把 A错 的两根引线移到 L2 支路（替换该处导线）'},
 };
 const EXPLANATIONS={
   ammeterParallel:'A错直接跨电源两极，近似电源短路；把表改串到指定支路。',
   voltmeterSeries:'V错串入主回路，理想情况下电流近零；应并接在被测两节点。',
   reverse:'V₁正负柱接反，指针式表反偏；交换其正负引线。',
   range:'干路 0.90 A 超过 0—0.6 A 量程；改用合适量程。',
   switchPlace:'总开关断开会使两灯都灭；要单独控制 L₁，应把开关移入 L₁支路。',
   rheostatWrong:'只接 C、D 两上端，接入电阻近零；改为 A、C 一上一下。',
   seriesInstead:'两灯依次相接，只有一路；题目要求两灯跨同一对节点并联。',
   lampShort:'旁路线把 L₂两端并成同一节点，L₂熄灭；断开这条线。',
   sourceShort:'导线直接接电源两极，危险；只作屏幕模拟，断开旁路。',
   multiError:'L₂被短接且 V₁反接；需分别恢复 L₂回路与电压表极性。',
   oneMove:'只移动 V₁正端从 L₁左端到 L₂左端，负端保持在 L₂右端；无连接点的交叉线不相连。',
   oneDelete:'只删除跨 L₂的旁路线，保留所有元件；两灯恢复串联。',
   multiFix:'保留三灯、三开关、两只电压表；把 A错的两根引线从电源两极移至 L₂支路，替换该处导线，交叉无点不相连。'
 };
 // 移动端点后重布导线走向（保持正交）
 function repoint(points,end,newCoord){
   const ps=points.map(p=>p.slice());
   if(end==='a'){
     const p0=ps[0],p1=ps[1];
     ps[0]=newCoord.slice();
     if(p1){if(p0[0]===p1[0])ps[1]=[newCoord[0],p1[1]];else if(p0[1]===p1[1])ps[1]=[p1[0],newCoord[1]];}
   }else{
     const n=ps.length,pn=ps[n-1],pp=ps[n-2];
     ps[n-1]=newCoord.slice();
     if(pp){if(pn[0]===pp[0])ps[n-2]=[newCoord[0],pp[1]];else if(pn[1]===pp[1])ps[n-2]=[pp[0],newCoord[1]];}
   }
   return ps;
 }
 function midOfLongest(points){
   let best=null,bl=-1;
   for(let i=0;i<points.length-1;i++){
     const x1=points[i][0],y1=points[i][1],x2=points[i+1][0],y2=points[i+1][1];
     const l=Math.hypot(x2-x1,y2-y1);
     if(l>bl){bl=l;best=[(x1+x2)/2,(y1+y2)/2];}
   }
   return best||points[0].slice();
 }
 // 把用户改线操作应用到错图上（返回新 net，不改原对象）
 function applyEdits(base,edits){
   const net={...base,edges:base.edges.map(e=>({...e,points:e.points.map(p=>p.slice())})),switches:{...(base.switches||{})}};
   for(const op of edits||[]){
     if(op.op==='detachLead'){
       const e=net.edges.find(x=>x.id===op.edge);
       if(e&&e.type==='voltmeter'&&op.end==='a'){
         e.a='V1_FREE';e.positive='V1_FREE';e.points[0]=[e.points[0][0],e.points[0][1]-35];
       }
     }else if(op.op==='moveEnd'){
       const e=net.edges.find(x=>x.id===op.edge);
       if(!e)continue;
       const oldA=e.a,oldB=e.b,oldPts=e.points.map(p=>p.slice());
       if(op.end==='a'){e.a=op.toNode;e.points=repoint(e.points,'a',op.toCoord);}
       else{e.b=op.toNode;e.points=repoint(e.points,'b',op.toCoord);}
       if(e.type==='voltmeter'&&e.positive===(op.end==='a'?oldA:oldB))e.positive=op.toNode;
       e.at=midOfLongest(e.points);
       // 元件落到导线位置：该导线被替换（移除）
       const w=net.edges.find(x=>x!==e&&x.type==='wire'&&pairKey(x.a,x.b)===pairKey(e.a,e.b));
       if(w)net.edges=net.edges.filter(x=>x!==w);
       // 电表移出原来位置：若旧两端在剩余电路中已彻底断开（说明它曾串联在干路），自动用导线填补空位；
       // 若旧两端经其他元件仍连通（如 A错 曾短接 P-N，主回路仍在），则不填补
       if((e.type==='voltmeter'||e.type==='ammeter')&&(oldA!==e.a||oldB!==e.b)){
         const p2={},f2=x=>{p2[x]??=x;return p2[x]===x?x:p2[x]=f2(p2[x]);},j2=(a,b)=>{p2[f2(a)]=f2(b);};
         for(const x of net.edges){if(x===e)continue;f2(x.a);f2(x.b);if(x.type!=='switch'||(net.switches||{})[x.id]!==false)j2(x.a,x.b);}
         if(f2(oldA)!==f2(oldB))net.edges.push({id:'补线'+oldA+oldB,type:'wire',a:oldA,b:oldB,points:oldPts,at:midOfLongest(oldPts)});
       }
     }else if(op.op==='delWire'){
       net.edges=net.edges.filter(x=>x.id!==op.edge);
     }else if(op.op==='swapMeter'){
       const e=net.edges.find(x=>x.id===op.edge);if(e)e.reverse=e.reverse?false:'X';
     }else if(op.op==='chRange'){
       const e=net.edges.find(x=>x.id===op.edge);if(e)e.range=op.value;
     }else if(op.op==='reterm'){
       const e=net.edges.find(x=>x.id===op.edge);if(e){e.terminal=op.value;e.r=op.value==='CD'?0.001:10;}
     }
   }
   return net;
 }
 // 连通性：负载 loadId 在给定开关状态下能否形成回路
 function powered(net,sw,loadId,force){
   const p={},f=x=>{p[x]??=x;return p[x]===x?x:p[x]=f(p[x]);},j=(a,b)=>{p[f(a)]=f(b);};
   for(const e of net.edges){f(e.a);f(e.b);
     let c=e.type==='wire'||e.type==='ammeter';
     if(e.type==='switch')c=force&&force.id===e.id?force.closed:sw[e.id]!==false;
     if(c)j(e.a,e.b);}
   const L=net.edges.find(e=>e.id===loadId);
   if(!L)return false;
   const RP=f('P'),RN=f('N');
   return (f(L.a)===RP&&f(L.b)===RN)||(f(L.a)===RN&&f(L.b)===RP);
 }
 // 改错检查：全部基于真实求解结果，不靠文案
 function checkEdit(caseName,net,res){
   const R=res.roots||{},eq=(x,y)=>R[x]!==undefined&&R[x]===R[y];
   const E=id=>net.edges.find(e=>e.id===id);
   const I=id=>res.current[id]||0;
   const fail=m=>({ok:false,msg:m}),pass=m=>({ok:true,msg:m});
   const inSeries=(a,b)=>inSeriesTopo(net,a,b); // P0 修复：拓扑判定，非电流数值比较
   const inParallel=(a,b)=>{const x=E(a),y=E(b);if(!x||!y)return false;return eq(x.a,y.a)&&eq(x.b,y.b)||eq(x.a,y.b)&&eq(x.b,y.a);};
   switch(caseName){
     case 'ammeterParallel':
       if(res.sourceShort)return fail('仍危险：有表直接跨接在电源两极，近似电源短路。');
       if(!E('A错'))return fail('A错不见了，请点“重置”后重试。');
       if(!inSeries('A错','L2'))return fail('A错还未正确接入 L2 支路；请根据接线节点和支路通路检查，不能仅凭电流数值判断串联。');
       return pass('正确：A错已串联接入 L2 支路，电源短路解除。');
     case 'voltmeterSeries':
       if(Math.abs(res.total)<1e-6)return fail('电路仍不通：V错还串在干路里（理想电压表内阻很大）。');
       if(!inParallel('V错','L1'))return fail('V错还没有并联到 L1 两端。');
       return pass('正确：V错已并联在 L1 两端，电路恢复通路。');
     case 'reverse':{
       const v=res.meter['V₁']??0;
       if(v<-1e-9)return fail('V₁ 指针仍反偏：正负接线柱还是接反的。');
       return pass('正确：V₁ 正负接线柱已纠正，读数为正。');
     }
     case 'range':{
       const a=E('A₀'),v=Math.abs(res.meter['A₀']??0);
       if(!a)return fail('A₀不见了，请重置。');
       if(v>(a.range||3)+1e-9)return fail(`读数 ${v.toFixed(2)} A 仍超出 ${(a.range||3)} A 量程。`);
       return pass(`正确：${a.range} A 量程已覆盖读数 ${v.toFixed(2)} A。`);
     }
     case 'switchPlace':{
       const sw=net.switches||{};
       // 动态找开关：应存在一个开关，闭合/断开能控制 L1 通断，且断开时 L2 仍通（只控制 L1）
       let ok=false;
       for(const c of net.edges.filter(e=>e.type==='switch')){
         const on=powered(net,{...sw,[c.id]:true},'L1');
         const off=powered(net,{...sw,[c.id]:false},'L1');
         const l2off=powered(net,{...sw,[c.id]:false},'L2');
         if(on&&!off&&l2off){ok=true;break;}
       }
       if(!ok)return fail('开关还没有正确串联在 L1 支路中（闭合/断开时 L1 应通/断，且 L2 不应受控）。');
       return pass('正确：开关已串入 L1 支路，只控制 L1。');
     }
     case 'rheostatWrong':{
       const r=E('L2');
       if(!r||r.r<1)return fail('变阻器接入电阻仍近零：应改接为一上一下。');
       return pass('正确：变阻器已按一上一下接入。');
     }
     case 'seriesInstead':{
       if(res.sourceShort)return fail('出现电源短路！');
       if(!inParallel('L1','L2'))return fail('两灯还没有并联（两端没有接到同一对节点）。');
       if(!(res.lit['L1']&&res.lit['L2']))return fail('两灯没有都亮起来。');
       return pass('正确：两灯已并联在同一对节点之间。');
     }
     case 'lampShort':{
       if(res.sourceShort)return fail('出现电源短路！');
       const l2=E('L2');
       if(l2&&eq(l2.a,l2.b))return fail('L2 两端仍是同一节点，还被短接。');
       if(!(res.lit['L1']&&res.lit['L2']))return fail('两灯没有都正常发光。');
       return pass('正确：旁路线已删除，两灯串联正常工作。');
     }
     case 'sourceShort':{
       if(res.sourceShort)return fail('电源仍被导线直接短接！');
       if(Math.abs(res.total)<1e-6)return fail('电路仍不通，请检查连接。');
       return pass('正确：短接导线已删除，电路恢复。');
     }
     case 'multiError':{
       const l2=E('L2');
       if(res.sourceShort)return fail('出现电源短路！');
       if(l2&&eq(l2.a,l2.b))return fail('L2 还被旁路线短接。');
       if((res.meter['V₁']??0)<-1e-9)return fail('V₁ 指针仍反偏。');
       if(!(res.lit['L1']&&res.lit['L2']))return fail('两灯没有都正常发光。');
       return pass('正确：短路解除且 V₁ 极性纠正。');
     }
     case 'oneMove':{
       if(res.sourceShort)return fail('出现电源短路，不能这样连接。');
       if(!inParallel('V₁','L2'))return fail('V₁ 还没有跨接在 L2 两端，请核对两处接线点。');
       if((res.meter['V₁']??0)<0)return fail('电压表正负接线柱接反了。');
       return pass('正确：V₁ 已改测 L2 电压。');
     }
     case 'oneDelete':{
       if(res.sourceShort)return fail('出现电源短路！');
       const l2=E('L2');
       if(l2&&eq(l2.a,l2.b))return fail('L2 两端仍是同一节点。');
       if(!(res.lit['L1']&&res.lit['L2']))return fail('两灯没有都正常发光。');
       return pass('正确：只删一根旁路线，两灯恢复串联。');
     }
     case 'multiFix':{
       if(res.sourceShort)return fail('仍有电源短路！先处理跨接电源的导线。');
       if(!E('A错'))return fail('A错不见了，请重置。');
       if(!inSeries('A错','L2'))return fail('A错还没有串联在 L2 支路中。');
       return pass('正确：A错已串联接入 L2 支路。');
     }
     default:return fail('未知题型。');
   }
 }
 // 节点显示名（优先用图注标签 B、N…）
 function nodeLabel(net,node){
   const nc=nodeCoords(net,false),c=nc[node];
   if(!c)return String(node);
   for(const [name,pt] of Object.entries(net.labels||{})){
     if(Math.abs(pt[0]-c[0])<1&&Math.abs(pt[1]-c[1])<1)return name;
   }
   return String(node);
 }
 // 电表测量对象：由拓扑推导
 function describeMeasure(net,res,meterId){
   const m=net.edges.find(e=>e.id===meterId);
   if(!m||(m.type!=='ammeter'&&m.type!=='voltmeter'))return null; // 非电表返回 null
   const R=res.roots||{},F=x=>R[x];
   if(m.type==='voltmeter'){
     const plus=m.reverse?m.b:(m.positive||m.a),minus=m.reverse?(m.positive||m.a):m.b;
     const t=[F(m.a),F(m.b)].sort().join('|');
     const hit=net.edges.filter(e=>['lamp','rheostat','resistor'].includes(e.type)&&[F(e.a),F(e.b)].sort().join('|')===t).map(e=>e.id);
     return {kind:'V',plusLabel:nodeLabel(net,plus),minusLabel:nodeLabel(net,minus),loads:hit,value:res.meter[meterId]??0};
   }
   const I=res.meter[meterId]??0;
   const measured=seriesLoadsTopo(net,meterId); // P0 修复：拓扑判定（测量包含），非电流数值比较
   // 区分严格串联（支路表）与干路测量：严格串联要求双向断流
   const strict=measured.filter(id=>inSeriesTopo(net,meterId,id));
   return {kind:'A',series:measured,strict,value:I};
 }
 function fmtMeasure(d,meterId){
   if(!d)return '';
   if(d.kind==='V')return `${meterId}：＋接线柱→节点${d.plusLabel}，－接线柱→节点${d.minusLabel}；跨接${d.loads.length?d.loads.join('、'):'（无用电器）'}，读数 ${d.value.toFixed(2)} V。`;
   if(!d.series.length)return `${meterId}所在路径电流 ${d.value.toFixed(2)} A。`;
   // 严格串联（单支路）vs 干路测量（含多支路）
   if(d.strict.length===d.series.length&&d.series.length===1)return `${meterId}与${d.series[0]}串联，读数 ${d.value.toFixed(2)} A。`;
   if(d.strict.length===d.series.length)return `${meterId}与${d.series.join('、')}串联，读数 ${d.value.toFixed(2)} A。`;
   return `${meterId}测干路电流（含${d.series.join('、')}支路），读数 ${d.value.toFixed(2)} A。`;
 }
 // 改错页：待选目标接线柱叠加层
 function termOverlay(tm,pendingKey){
   let g='<g class="term-layer">';
   for(const t of tm){
     const isP=t.key===pendingKey;
     g+=`<g data-action="ac:term" data-value="${t.key}" style="cursor:pointer"><circle cx="${t.x}" cy="${t.y}" r="18" fill="rgba(0,0,0,0)"/><circle cx="${t.x}" cy="${t.y}" r="${isP?10:7}" fill="${isP?C.orange:'#ffffff'}" stroke="${isP?C.orange:C.ink}" stroke-width="2.5"><title>接线柱：点击作为移动目标</title></circle></g>`;
   }
   return g+'</g>';
 }
 // ---- 互画页：学生连线 ----
 function renderWiringPage(p,s,q){
   const net=make(p,s),tm=terminals(net,true),req=requiredWires(net,true);
   const fullRes=solve(net,net.switches||{});
   const byKey={};for(const t of tm)byKey[t.key]=t;
   const doneReq=req.filter(r=>s.userWires.some(w=>w.ok&&pairKey(w.n1,w.n2)===pairKey(r.n1,r.n2)));
   const done=req.length>0&&doneReq.length===req.length;
   let picture,controls,metrics='',caption;
   if(s.showRef){
     const res=solve(net,net.switches||{});
     picture=draw(net,res,{q:3,physical:false});
     caption='对照规范电路图，记清各元件的连接关系，然后点击“开始连线”。';
     controls=`<button data-action="ac:showRef" class="primary">开始连线 →</button><button data-action="ac:wireMode">教师演示模式</button>`;
   }else if(done){
     const res=solve(net,net.switches||{});
     picture=`<div class="ac-compare"><div><b>你的实物接线</b>${drawWiring(net,tm,s.userWires,null)}</div><div><b>规范电路图</b>${draw(net,res,{q:3,physical:false})}</div></div>`;
     caption='全部导线连接正确！对照检查：每根导线的两端是否与电路图一致。';
     metrics=`<div class="readings"><span>电路状态<b>有电流</b></span><span>干路电流<b>${res.total.toFixed(2)} A</b></span></div>`;
     controls=`<button data-action="ac:showRef">查看电路图</button><button data-action="ac:wireReset">重新连线</button><button data-action="ac:wireMode">教师演示模式</button>`;
   }else{
     picture=drawWiring(net,tm,s.userWires,s.pendingT);
     caption=s.pendingT?'已选定起点（橙色），再点击另一个接线柱作为终点；点击已选柱可取消。':'点击一个接线柱作为导线起点，再点击另一个接线柱作为终点。';
     controls=`<button data-action="ac:showRef">← 查看电路图</button><button data-action="ac:wireUndo">撤销上根</button><button data-action="ac:wireReset">全部重连</button><button data-action="ac:wireMode">教师演示模式</button><span class="wire-progress">已连 ${doneReq.length}/${req.length}</span>`;
     if(s.wireMsg)controls+=`<div class="wire-msg" role="alert">${H(s.wireMsg)}</div>`;
     metrics=`<div class="readings"><span>连线进度<b>${doneReq.length} / ${req.length}</b></span></div>`;
   }
   return {picture,controls,metrics,caption,data:{net,reqCount:req.length,doneCount:doneReq.length,done,terms:tm.map(t=>t.key),userWires:s.userWires.map(w=>({...w})),sourceShort:fullRes.sourceShort}};
 }
 // ---- 改错页：真实改线 ----
 function p29Overlay(net,s){
   const trace=(e,end,pts)=>`<g class="p29-wire${s.p29SelectedWire?.edge===e.id&&s.p29SelectedWire.end===end?' is-selected':''}" data-p29-wire="${H(e.id)}" data-p29-end="${end}">${poly(pts,'#087c83',4,'class="p29-wire-line"')}${poly(pts,'transparent',40,'class="p29-wire-hit"')}<title>${H(e.id)} 引线：右键断开；触屏先点选</title></g>`;
   const wires=net.edges.filter(e=>e.type==='wire').map(e=>trace(e,'',e.points)).join('');
   const v=net.edges.find(e=>e.id==='V₁'),ps=v.points,at=v.at;
   const leads=trace(v,'a',[...ps.slice(0,2),[at[0]-26,at[1]]])+trace(v,'b',[[at[0]+26,at[1]],...ps.slice(2)]);
   const terms=terminals(net,false).map(t=>`<g class="p29-term${s.p29Pending===t.key?' is-selected':''}${t.node==='V1_FREE'?' is-free':''}" data-p29-term="${H(t.key)}"><circle class="p29-hit" cx="${t.x}" cy="${t.y}" r="30"/><circle class="p29-dot" cx="${t.x}" cy="${t.y}" r="9"/><title>接线柱：点击选择</title></g>`).join('');
   return `<g class="p29-wires">${wires}${leads}</g><g class="p29-terms">${terms}</g>`;
 }
 function p29Detach(s,p,edgeId,end){
   s.p29Pending=null;s.p29SelectedWire=null;
   const e=make(p,{...s,fixed:false}).edges.find(x=>x.id===edgeId);
   if(!e||e.type!=='wire'&&e.type!=='voltmeter')s.editMsg='只能删除导线，不能删除灯泡、电表或开关。';
   else if((s.edits||[]).length)s.editMsg='本题只改一根线。要重新选，请先撤销或重置。';
   else if(edgeId==='V₁'&&end==='b')s.editMsg='电压表这一端已经接对，应保持不变。';
   else{
     s.edits=[edgeId==='V₁'?{op:'detachLead',edge:'V₁',end:'a'}:{op:'delWire',edge:edgeId}];
     s.editMsg=edgeId==='V₁'?'旧引线已断开；点自由端，再点新的接线柱。':'这根导线已删除，电路已改变；若不符合题意，可按 Ctrl+Z 撤销。';
     s.editDone=false;s.editOk=false;s.showParse=false;s.showStd=false;s.p29Compare=false;
   }
 }
 function p29Term(s,p,key){
   s.p29SelectedWire=null;
   if(!s.p29Pending){s.p29Pending=key;s.editMsg='已选第一个接线柱；请点第二个。';return;}
   const first=s.p29Pending;s.p29Pending=null;
   if(first===key){s.editMsg='已取消选择。';return;}
   const base=make(p,{...s,fixed:false}),net=applyEdits(base,s.edits||[]),ts=terminals(net,false),t1=ts.find(t=>t.key===first),t2=ts.find(t=>t.key===key),v=net.edges.find(e=>e.id==='V₁');
   if(!t1||!t2){s.editMsg='请点击图上的圆形接线柱。';return;}
   if((s.edits||[])[0]?.op==='moveEnd'||(s.edits||[])[0]?.op==='delWire'){s.editMsg='本题只改电压表的一根引线；如需重接，请先撤销。';return;}
   let source=t1,target=t2;
   if(target.node===v.a&&source.node!==v.a)[source,target]=[target,source];
   if(source.node!==v.a){s.editMsg=t1.node===v.b||t2.node===v.b?'电压表这一端已经接对，应保持不变。':'请选择电压表需改接的引线端点。';return;}
   if(target.node===v.a||target.node===v.b){s.editMsg='两端不能接在同一节点；接线未改变。';return;}
   const op={op:'moveEnd',edge:'V₁',end:'a',toNode:target.node,toCoord:[target.x,target.y]},trial=applyEdits(base,[op]),result=solve(trial,trial.switches||{});
   if(result.sourceShort){s.editMsg='这种接法会造成电源短路，未提交。';return;}
   s.edits=[op];s.p29SelectedWire=null;s.editMsg='已接上新引线。请检查答案；若接错可按 Ctrl+Z 撤销。';s.editOk=false;s.editDone=false;s.showParse=false;s.showStd=false;s.p29Compare=false;
 }
 function renderEditPage(p,s,q){
   const caseName=p.cases?.[s.acCase]||p.config;
   const isP29=caseName==='oneMove';
   const rules=EDIT_RULES[caseName]||{ops:['moveEnd','delWire'],max:8,hint:'选择导线或元件进行改线'};
   const net=applyEdits(make(p,{...s,fixed:false}),s.edits||[]);
   const result=solve(net,net.switches||{});
   let picture;
   if(s.showStd||isP29&&s.p29Compare&&(s.edits||[]).length){
     const bad=make(p,{...s,fixed:false}),rBad=solve(bad,bad.switches||{});
     const good=isP29&&s.p29Compare?net:make(p,{...s,fixed:true}),rGood=isP29&&s.p29Compare?result:solve(good,good.switches||{});
     const reading=n=>`V₁ ${n.meter['V₁']?.toFixed(2)??'—'} V`;
     picture=`<div class="ac-fixwrap"><div class="ac-compare"><div><b>改前（错图）</b>${draw(bad,rBad,{q:1})}${isP29?`<small>${reading(rBad)}</small>`:''}</div><div><b>${isP29&&s.p29Compare?'当前（真实改线）':'改后（标准）'}</b>${draw(good,rGood,{q:isP29?1:2})}${isP29?`<small>${reading(rGood)}</small>`:''}</div></div></div>`;
   }else{
     picture=`<div class="ac-fixwrap">`+draw(net,result,{q:isP29?Math.min(q,1):q,selected:s.selected,guess:s.selected});
     if(isP29)picture=picture.replace(/<\/svg>\s*$/,p29Overlay(net,s)+'</svg>');
     else if(s.pendingOp==='moveA'||s.pendingOp==='moveB'){
       const tm=terminals(net,false);
       picture=picture.replace(/<\/svg>\s*$/,termOverlay(tm,null)+'</svg>');
     }
     picture+='</div>';
   }
   if(isP29)picture=picture.replaceAll('viewBox="0 0 760 400"','viewBox="70 45 620 350"');
   const sel=net.edges.find(e=>e.id===s.selected);
   let controls='';
   if(p.cases&&!isP29)controls+=`<label>错图类型 <select data-var="acCase" aria-label="错图类型">${p.cases.map((x,i)=>`<option value="${i}" ${s.acCase===i?'selected':''}>${i+1}号原创模拟题</option>`).join('')}</select></label>`;
   controls+=`<div class="edit-hint">任务：${isP29?'使电压表测 L₂ 两端电压；只改接一根引线的一端':H(rules.hint)}（限改 ${rules.max} 次，已完成 ${isP29?(s.edits||[]).filter(e=>e.op==='moveEnd').length:(s.edits||[]).length} 次）</div>`;
   if(isP29){
     controls+=`<div class="p29-actions"><button data-action="ac:check" class="primary">检查答案</button><button data-action="ac:undoEdit">撤销</button><button data-action="ac:resetEdit">重置</button></div>`;
     controls+=`<div class="edit-hint">${s.p29Pending?'已选第一个接线柱；再点第二个即可连线。':(s.edits||[])[0]?.op==='detachLead'?'旧引线已断开；点自由端，再点新的接线柱。':'左键依次点两个接线柱即可改线；右键点导线可断开。触屏先点导线再点“删除选中导线”。'} Ctrl+Z 可撤销。</div>`;
     if(s.p29SelectedWire)controls+=`<button data-action="ac:p29delete">删除选中导线</button>`;
     if(s.p29Hint)controls+=`<div class="edit-hint">提示 ${s.p29Hint}：${s.p29Hint===1?'先沿导线找电压表现在跨接的两点，再找目标灯泡的两端。':'比较两组端点；已经接对的一端不用移动，并检查正负接线柱。'}</div>`;
     controls+=`<button data-action="ac:p29hint" ${s.p29Hint>=2?'disabled':''}>提示${s.p29Hint?`（${s.p29Hint}/2）`:''}</button>`;
     if((s.edits||[]).length)controls+=`<button data-action="ac:p29compare">${s.p29Compare?'返回当前电路':'对照改前与当前'}</button>`;
     controls+=`<button data-action="ac:parse">${s.showParse?'隐藏解析':'查看解析'}</button><button data-action="ac:stdShow">${s.showStd?'隐藏标准改法':'查看标准改法'}</button>`;
   }else if(s.pendingOp==='moveA'||s.pendingOp==='moveB'){
     controls+=`<div class="edit-hint">已选择 <b>${H(s.selected)}</b> 的${s.pendingOp==='moveA'?'A':'B'}端，请点击目标接线柱。<button data-action="ac:editOp" data-value="">取消</button></div>`;
   }else if(!isP29&&sel){
     const ops=[];
     if(rules.ops.includes('moveEnd')){ops.push(`<button data-action="ac:editOp" data-value="moveA">移动A端</button>`);ops.push(`<button data-action="ac:editOp" data-value="moveB">移动B端</button>`);}
     if(rules.ops.includes('delWire')&&sel.type==='wire')ops.push(`<button data-action="ac:editOp" data-value="delWire">删除这根导线</button>`);
     if(rules.ops.includes('swapMeter')&&(sel.type==='voltmeter'||sel.type==='ammeter'))ops.push(`<button data-action="ac:editOp" data-value="swapMeter">交换正负接线柱</button>`);
     if(rules.ops.includes('chRange')&&sel.type==='ammeter')ops.push(`<button data-action="ac:editOp" data-value="chRange">更换量程（当前 ${sel.range||'—'} A）</button>`);
     if(rules.ops.includes('reterm')&&sel.type==='rheostat')ops.push(`<button data-action="ac:editOp" data-value="reterm">改接线柱（当前 ${sel.terminal||'A-C'}）</button>`);
     controls+=`<div class="edit-ops">已选 <b>${H(sel.id)}</b>：${ops.join('')||'本题对该元件无可用操作'}</div>`;
   }else if(!isP29){
     controls+=`<div class="edit-hint">点击一根导线或一个元件，再选择操作。</div>`;
   }
   if(!isP29)controls+=`<button data-action="ac:undoEdit">撤销</button><button data-action="ac:resetEdit">重置</button><button data-action="ac:check" class="primary">检查答案</button><button data-action="ac:parse">${s.showParse?'隐藏解析':'查看解析'}</button><button data-action="ac:stdShow">${s.showStd?'隐藏标准改法':'对照标准改法'}</button>`;
   if(s.editMsg)controls+=`<div class="edit-msg${s.editOk?' ok':''}" role="alert">${H(s.editMsg)}</div>`;
   let caption;
   if(s.showParse)caption='解析：'+(EXPLANATIONS[caseName]||'');
   else if(s.editDone)caption='已通过检查。可对照标准改法，或重置后换一种改法试试。';
   else caption=isP29?'先判断电压表现在测哪一段，再点击两个接线柱改接一端；已接对的一端保持不变。':'先观察错在哪里：点击可疑的导线或元件，再选择改线操作；改完点“检查答案”。';
   if(result.sourceShort)caption+=' 注意：当前存在电源短路（危险，仅屏幕模拟）。';
   const before=isP29?solve(make(p,{...s,fixed:false})):null;
   const metrics=isP29&&(q>=2||(s.edits||[]).length)?`<div class="readings"><span>原图 V₁<b>${before.meter['V₁'].toFixed(2)} V</b></span><span>当前 V₁<b>${result.meter['V₁'].toFixed(2)} V</b></span><span>当前干路 I<b>${result.total.toFixed(2)} A</b></span></div>`:'';
   return {picture,controls,metrics,caption,data:{net,caseName,editCount:(s.edits||[]).length,editDone:s.editDone,sourceShort:result.sourceShort,meter:result.meter,total:result.total,edits:(s.edits||[]).map(e=>({...e}))}};
 }
 // ---- 拓扑串联判定（P0 修复）：不用电流数值比较 ----
 // 严格串联：A 与 B 互为唯一路径 ⟺ 断开任一，另一必断流（基于实际求解）
 // 这能区分"同支路串联"与"等阻并联恰好电流相等"的情况
 function inSeriesTopo(net,idA,idB){
   const sw=net.switches||{};
   const getI=(res,id)=>Math.abs((res.current||{})[id]||0);
   const base=solve(net,sw);
   if(getI(base,idA)<1e-9||getI(base,idB)<1e-9)return false; // 有一无电流，保守判否
   const cut=id=>({...net,edges:net.edges.filter(e=>e.id!==id),switches:{...sw}});
   if(getI(solve(cut(idA),sw),idB)>1e-9)return false; // 断开 A，B 仍有电流 → 非串联
   if(getI(solve(cut(idB),sw),idA)>1e-9)return false; // 断开 B，A 仍有电流 → 非串联
   return true;
 }
 // 测量包含：电表 M 是否测到负载 L 的电流（断开 M 则 L 断流，单向）
 // 用于 describeMeasure：干路表测总电流（含各支路），支路表测本支路
 function measuresLoad(net,meterId,loadId){
   const sw=net.switches||{};
   const getI=(res,id)=>Math.abs((res.current||{})[id]||0);
   const base=solve(net,sw);
   if(getI(base,meterId)<1e-9||getI(base,loadId)<1e-9)return false;
   const cutM={...net,edges:net.edges.filter(e=>e.id!==meterId),switches:{...sw}};
   return getI(solve(cutM,cutM.switches),loadId)<1e-9;
 }
 // 找出被指定电流表测到电流的所有负载（describeMeasure 用）
 function seriesLoadsTopo(net,meterId){
   const m=net.edges.find(e=>e.id===meterId);
   if(!m||m.type!=='ammeter')return [];
   const sw=net.switches||{};
   const getI=(res,id)=>Math.abs((res.current||{})[id]||0);
   const base=solve(net,sw);
   if(getI(base,meterId)<1e-9)return [];
   const loads=net.edges.filter(e=>['lamp','rheostat','resistor'].includes(e.type));
   return loads.filter(L=>measuresLoad(net,meterId,L.id)).map(e=>e.id);
 }
 // ---- 交互动作 ----
 function actTerm(s,p,key){
   if(p.task==='convert'&&s.wireMode==='student'&&!s.showRef){
     if(s.pendingT===key){s.pendingT=null;s.wireMsg='';return;}
     if(!s.pendingT){s.pendingT=key;s.wireMsg='';return;}
     const k1=s.pendingT,k2=key;s.pendingT=null;
     const net=make(p,s),tm=terminals(net,true),byKey={};
     for(const t of tm)byKey[t.key]=t;
     const t1=byKey[k1],t2=byKey[k2];
     if(!t1||!t2){s.wireMsg='接线柱无效，请重试。';return;}
     const v=validateWire(net,true,s.userWires,t1.node,t2.node);
     if(v.push)s.userWires.push({k1,k2,n1:t1.node,n2:t2.node,ok:v.ok});
     s.wireMsg=v.ok?'':v.reason+'（红色为错误尝试，可点“撤销上根”去掉）';
     return;
   }
   if(p.task==='error'&&(s.pendingOp==='moveA'||s.pendingOp==='moveB')){
     const caseName=p.cases?.[s.acCase]||p.config;
     const rules=EDIT_RULES[caseName]||{ops:[],max:0};
     const net=applyEdits(make(p,{...s,fixed:false}),s.edits||[]);
     const tm=terminals(net,false),byKey={};for(const t of tm)byKey[t.key]=t;
     const t=byKey[key],end=s.pendingOp==='moveA'?'a':'b';
     s.pendingOp=null;
     if(!t){s.editMsg='接线柱无效。';return;}
     if((s.edits||[]).length>=rules.max){s.editMsg=`已达改线次数上限（${rules.max}次），请先撤销。`;return;}
     const e=net.edges.find(x=>x.id===s.selected);
     if(!e){s.editMsg='请先选择要移动的导线或元件。';return;}
     const other=end==='a'?e.b:e.a;
     if(t.node===other){s.editMsg='两端不能接在同一个节点上。';return;}
     if(t.node===(end==='a'?e.a:e.b)){s.editMsg='这一端已经在这个节点上，无需移动。';return;}
     s.edits=[...(s.edits||[]),{op:'moveEnd',edge:e.id,end,toNode:t.node,toCoord:[t.x,t.y]}];
     s.selected=null;s.editMsg='';s.editDone=false;s.showParse=false;
   }
 }
 function actEditOp(s,p,op){
   const caseName=p.cases?.[s.acCase]||p.config;
   const rules=EDIT_RULES[caseName]||{ops:[],max:0};
   if(!op){s.pendingOp=null;s.editMsg='';return;}
   const sel=s.selected;
   if(!sel){s.editMsg='请先点击选择一根导线或一个元件。';return;}
   if(!(rules.ops.includes(op)||(['moveA','moveB'].includes(op)&&rules.ops.includes('moveEnd')))){s.editMsg='本题不允许这种操作。';return;}
   const net=applyEdits(make(p,{...s,fixed:false}),s.edits||[]);
   const e=net.edges.find(x=>x.id===sel);
   if(!e){s.editMsg='所选目标不存在，请重选。';s.selected=null;return;}
   if(op==='moveA'||op==='moveB'){s.pendingOp=op;s.editMsg='';return;}
   if((s.edits||[]).length>=rules.max){s.editMsg=`已达改线次数上限（${rules.max}次），请先撤销。`;return;}
   if(op==='delWire'){
     if(e.type!=='wire'){s.editMsg='只能删除导线，不能删除元件。';return;}
     s.edits=[...(s.edits||[]),{op:'delWire',edge:e.id}];
   }else if(op==='swapMeter'){
     if(e.type!=='voltmeter'&&e.type!=='ammeter'){s.editMsg='只能对电表交换接线柱。';return;}
     s.edits=[...(s.edits||[]),{op:'swapMeter',edge:e.id}];
   }else if(op==='chRange'){
     if(e.type!=='ammeter'){s.editMsg='只能对电流表更换量程。';return;}
     s.edits=[...(s.edits||[]),{op:'chRange',edge:e.id,value:e.range===0.6?3:0.6}];
   }else if(op==='reterm'){
     if(e.type!=='rheostat'){s.editMsg='只能对滑动变阻器改接线柱。';return;}
     s.edits=[...(s.edits||[]),{op:'reterm',edge:e.id,value:e.terminal==='CD'?'AC':'CD'}];
   }
   s.selected=null;s.editMsg='';s.editDone=false;s.showParse=false;
 }
 function actCheck(s,p){
   const caseName=p.cases?.[s.acCase]||p.config;
   const net=applyEdits(make(p,{...s,fixed:false}),s.edits||[]);
   const res=solve(net,net.switches||{});
   let r=checkEdit(caseName,net,res);
   if(caseName==='oneMove'){
     const op=(s.edits||[])[0],original=make(p,{...s,fixed:false}).edges.find(e=>e.id==='V₁'),v=net.edges.find(e=>e.id==='V₁');
     if(op?.op==='detachLead')r={ok:false,msg:'旧线已断开，还要把自由端接到新接线柱。'};
     else if(!op||op.op!=='moveEnd'||op.edge!=='V₁'||op.end!=='a'||v.b!==original.b||v.positive!==v.a)r={ok:false,msg:'只能改接电压表的一端，原来接对的一端必须保留。'};
   }
   s.editMsg=(r.ok?'✓ ':'✗ ')+r.msg;s.editOk=r.ok;s.editDone=r.ok;
   if(r.ok)s.showParse=true;
 }
 if(typeof document!=='undefined'){
   const active=()=>typeof page!=='undefined'&&lessons[page]?.config==='oneMove';
   document.addEventListener('click',ev=>{
     if(!active())return;
     const term=ev.target.closest?.('[data-p29-term]'),wire=ev.target.closest?.('[data-p29-wire]');
     if(!term&&!wire)return;
     pause();const s=experiments[page];
     if(term)p29Term(s,lessons[page],term.dataset.p29Term);
     else{s.p29SelectedWire={edge:wire.dataset.p29Wire,end:wire.dataset.p29End};s.p29Pending=null;s.editMsg='已选中导线；触屏可点“删除选中导线”。';}
     window.render();
   });
   document.addEventListener('contextmenu',ev=>{
     if(!active()||!ev.target.closest?.('.ac-fixwrap svg'))return;
     ev.preventDefault();const wire=ev.target.closest?.('[data-p29-wire]');if(!wire)return;
     pause();p29Detach(experiments[page],lessons[page],wire.dataset.p29Wire,wire.dataset.p29End);window.render();
   });
   document.addEventListener('keydown',ev=>{
     if(!active()||!(ev.ctrlKey||ev.metaKey)||ev.shiftKey||ev.key.toLowerCase()!=='z')return;
     ev.preventDefault();pause();action(experiments[page],'ac:undoEdit','',lessons[page]);window.render();
   });
 }
 return {initial,render,action,solve,parallel,series,make,pages,terminals,requiredWires,validateWire,applyEdits,checkEdit,describeMeasure,powered,EDIT_RULES,EXPLANATIONS,inSeriesTopo,seriesLoadsTopo,measuresLoad};
})();
