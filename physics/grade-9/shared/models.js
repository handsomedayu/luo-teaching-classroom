'use strict';
const Physics={
 circuit({U=6,r1=10,r2=20,mode='series',closed=true,b1=true,b2=true,fault='normal'}){
  let I=0,I1=0,I2=0,U1=0,U2=0,R=Infinity;
  if(mode==='parallel'){
   const g1=b1?1/r1:0,g2=b2?1/r2:0;R=1/(g1+g2);
   if(closed){U1=b1?U:0;U2=b2?U:0;I1=U*g1;I2=U*g2;I=I1+I2;}
  }else if(mode==='single'){
   R=r1;if(closed){I=I1=U/r1;U1=U;}
  }else{
   R=fault==='open'?Infinity:r1+(fault==='short'?0:r2);
   if(closed){I=I1=U/R;I2=fault==='short'?0:I;U1=I*r1;U2=U-U1;}
  }
  return {U,I,I1,I2,U1,U2,R,P:U*I};
 },
 rheostat(p,term='AC',max=20){return term==='AB'?max:term==='CD'?0:max*(term.startsWith('A')?p:1-p);},
 lamp(U){U=Math.max(0,Math.min(2.5,U));const points=[[0,0],[.5,.13],[1,.19],[1.5,.235],[2,.27],[2.5,.3]];let k=points.findIndex(x=>x[0]>=U);if(k<=0)return 0;const [x,y]=points[k-1],[xx,yy]=points[k];return y+(yy-y)*(U-x)/(xx-x);},
 heat(I,R,t){return I*I*R*t;}
};
const ink='#18343f',teal='#096f70',orange='#a04c14';
const tx=(x,y,t,size=23,color=ink)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="${color}" font-size="${size}">${t}</text>`;
const line=(x1,y1,x2,y2,color=ink,width=3)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
const path=d=>`<path d="${d}" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`;
const dot=(x,y)=>`<circle cx="${x}" cy="${y}" r="5" fill="${ink}"/>`;
const svg=(s,label='物理教学示意图')=>`<svg viewBox="0 0 760 400" role="img" aria-label="${label}"><defs><marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="${teal}" stroke-width="1.5"/></marker></defs>${s}</svg>`;
const resistor=(x,y,label='R',vertical=false)=>`<g transform="translate(${x},${y})${vertical?' rotate(90)':''}"><rect x="-40" y="-13" width="80" height="26" fill="white" stroke="${ink}" stroke-width="3"/></g>${tx(x+(vertical?-65:0),y+(vertical?7:-27),label)}`;
const lamp=(x,y,brightness=0)=>`<circle cx="${x}" cy="${y}" r="25" fill="white"/><circle cx="${x}" cy="${y}" r="25" fill="rgba(255,190,65,${brightness*.9})" stroke="${ink}" stroke-width="3"/>${line(x-16,y-16,x+16,y+16)}${line(x-16,y+16,x+16,y-16)}`;
const meter=(x,y,letter,positive='left')=>`<circle cx="${x}" cy="${y}" r="23" stroke="${ink}" stroke-width="3" fill="white"/>${tx(x,y+8,letter,25)}${tx(x+(positive==='left'?-32:32),y-18,'+',18)}${tx(x+(positive==='left'?32:-32),y-18,'−',18)}`;
const battery=(x,y,U)=>`${line(x-15,y-30,x-15,y+30)}${line(x+15,y-16,x+15,y+16)}${tx(x-32,y-25,'+',21)}${tx(x+33,y-22,'−',21)}${tx(x,y+53,U+' V',24)}`;
const sw=(x,y,closed,label='S')=>`${dot(x-25,y)}${dot(x+25,y)}${line(x-25,y,x+25,closed?y:y-22)}${tx(x,y-32,label,20)}`;
const arrow=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${teal}" stroke-width="4" marker-end="url(#arrowhead)"/>`;
const fmt=(n,d=2)=>Number.isFinite(n)?Number(n.toFixed(d)).toString():'∞';
const stats=items=>`<div class="readings">${items.map(([k,v])=>`<span>${k}<b>${v}</b></span>`).join('')}</div>`;
const range=(key,label,value,min,max,step=1)=>`<label class="slider-label">${label}<input aria-label="${label}" data-var="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
const button=(key,label,val)=>`<button data-action="${key}"${val!==undefined?` data-value="${val}"`:''}>${label}</button>`;
const select=(key,label,value,items)=>`<label>${label} <select aria-label="${label}" data-var="${key}">${items.map(([v,t])=>`<option value="${v}" ${v===value?'selected':''}>${t}</option>`).join('')}</select></label>`;
function initial(p){if(p.scene==='advanced-circuit')return AdvancedCircuits.initial(p);return {U:6,r1:10,r2:p.scene==='safety'?10:20,mode:p.mode||'series',closed:true,b1:true,b2:true,fault:p.initialFault||'normal',pos:.5,terminal:p.terminal||'AC',range:p.kind==='A'?.6:3,ticks:18,charge:-1,length:1,area:1,ohmR:10,rp:10,lampU:2.5,load:0,...p.initial};}
function circuitNetwork(s){
 const parallel=s.mode==='parallel',single=s.mode==='single',branches=[];
 const add=(id,from,to,kind,value,route)=>branches.push({id,from,to,kind,value,route});
 if(parallel){
  add('S','P','A','switch',s.closed!==false,[[90,320],[90,200],[90,80]]);
  add('S1','A','C','switch',s.b1!==false,[[90,80],[250,80]]);
  add('R1','C','D','resistor',s.r1,[[250,80],[390,80]]);
  add('A1','D','N','ammeter',0,[[390,80],[640,80],[640,320]]);
  add('S2','A','E','switch',s.b2!==false,[[90,80],[90,200],[250,200]]);
  add('R2','E','F','resistor',s.r2,[[250,200],[390,200]]);
  add('A2','F','N','ammeter',0,[[390,200],[640,200],[640,320]]);
 }else{
  add('S','P','C','switch',s.closed!==false,[[90,320],[90,80],[250,80]]);
  add('R1','C','D','resistor',s.r1,[[250,80],[390,80]]);
  add('A','D','E','ammeter',0,[[390,80],[640,80],[640,140]]);
  if(single)add('return','E','N','wire',0,[[640,140],[640,320]]);
  else{
   add('R2','E','N',s.fault==='open'?'open':'resistor',s.r2,[[640,140],[640,320]]);
   if(s.fault==='short')add('bypass','E','N','wire',0,[[640,140],[710,140],[710,320],[640,320]]);
  }
 }
 return {branches,source:{positive:'P',negative:'N',voltage:s.U},parallel,single};
}
function circuitDrawing(s,p={},phase=0){
 const m=Physics.circuit(s),net=circuitNetwork(s),{parallel,single}=net;let g='';
 const segment=(points)=>path('M'+points.map(x=>x.join(' ')).join('L'));
 const component=(b)=>{
  let pts=b.route.map(x=>x.slice()),index=0;
  if(b.id==='S')index=parallel?0:1;else if(b.id==='S2')index=1;
  const a=pts[index],z=pts[index+1],vertical=a[0]===z[0],x=(a[0]+z[0])/2,y=(a[1]+z[1])/2;
  let radius=b.kind==='resistor'?(p.loadLamp?25:40):b.kind==='ammeter'?23:25;
  if(b.kind==='wire')return segment(pts);
  const direction=vertical?Math.sign(z[1]-a[1]):Math.sign(z[0]-a[0]);const before=vertical?[x,y-direction*radius]:[x-direction*radius,y],after=vertical?[x,y+direction*radius]:[x+direction*radius,y];
  let wire=segment([...pts.slice(0,index+1),before])+segment([after,...pts.slice(index+1)]),symbol='';
  if(b.kind==='switch'){const name=b.id.replace('1','₁').replace('2','₂');symbol=vertical?`<g transform="translate(${x} ${y}) rotate(-90)">${sw(0,0,b.value,'')}</g>`+tx(x-38,y+8,name,20):`<g transform="translate(${x} ${y})">${sw(0,0,b.value,name)}</g>`;}
  else if(b.kind==='open')symbol=dot(...before)+dot(...after)+tx(x+50,y,'断点',20);
  else if(b.kind==='ammeter'){
   if(p.meter)symbol=meter(x,y,'A')+(parallel&&b.id!=='A'?tx(x,y-34,b.id.replace('1','₁').replace('2','₂'),20):'');else return segment(pts);
  }else{
   const on=b.id==='R1'?m.I1:m.I2;
   symbol=p.loadLamp?lamp(x,y,p.brightness??(on?.65:0))+tx(x+(vertical?-58:0),y+(vertical?8:-34),b.id.replace('R','L')):resistor(x,y,b.id.replace('1','₁').replace('2','₂'),vertical);
   if(p.variable&&b.id==='R2')symbol+=`<path d="M${x+65} ${y-35}L${x+8} ${y+10}L${x+10} ${y-2}M${x+8} ${y+10}L${x+21} ${y+9}" fill="none" stroke="${orange}" stroke-width="3"/>`;
  }
  return wire+symbol;
 };
 for(const b of net.branches)g+=`<g data-branch="${b.id}" data-from="${b.from}" data-to="${b.to}" data-kind="${b.kind}" data-value="${b.value}">${component(b)}</g>`;
 g+=path('M90 320H285 M315 320H640')+battery(300,320,s.U);
 const volt=(id,from,to,x1,y1,x2,y2,y)=>`<g data-meter="${id}" data-from="${from}" data-to="${to}">${path(`M${x1} ${y1}V${y}H${(x1+x2)/2-23} M${(x1+x2)/2+23} ${y}H${x2}V${y2}`)+meter((x1+x2)/2,y,'V')+dot(x1,y1)+dot(x2,y2)}</g>`;
 if(p.meter){
  if(parallel){g+=volt('V1','C','D',250,80,390,80,130)+volt('V2','E','F',250,200,390,200,250);}
  else{g+=volt('V1','C','D',250,80,390,80,155);if(!single)g+=`<g data-meter="V2" data-from="E" data-to="N">${path('M640 140H510V207 M510 253V320H640')+`<circle cx="510" cy="230" r="23" fill="white" stroke="${ink}" stroke-width="3"/>${tx(510,238,'V',25)}${tx(493,199,'+',18)}${tx(493,268,'−',18)}`+dot(640,140)+dot(640,320)+tx(470,235,'V₂',20)}</g>`;}
 }
 if(parallel)g+=dot(90,80)+dot(640,80)+dot(90,200)+dot(640,200)+tx(67,190,'A')+tx(667,190,'B');
 for(const [id,y,I]of parallel?[['current1',80,m.I1],['current2',200,m.I2]]:[['current1',80,m.I]])if(I)g+=arrow(405,y-30,450,y-30)+`<circle data-motion="${id}" cx="410" cy="${y}" r="5" fill="${teal}"/>`;
 const N1=p.loadLamp?'L₁':p.lampR1?'灯泡 L':'R₁',N2=p.loadLamp?'L₂':p.variable?'变阻器 R₂':'R₂';
 const caption=parallel?(p.meter?'A、B 为节点；A₁、A₂ 测支路电流，两只 V 测支路电压':`A、B 为分流与汇流节点；${N1}、${N2} 各在一条支路上`)
  :single?(p.meter?`A 串联在电路中；V 跨接 ${N1} 两端`:`电路中只有一个用电器 ${N1}`)
  :p.meter?`A 串联在电路中；V₁ 跨接 ${N1}，V₂ 跨接 ${N2}`:`${N1}、${N2} 依次连接，只有一条电流路径`;
 return svg(g,'直流电路：'+s.mode)+'<p class="diagram-caption">'+caption+'</p>';
}
function circuitScene(p,s,q){
 const m=Physics.circuit(s);let controls=[];
 if(['switch','allSwitches'].includes(p.control))controls.push(button('closed',s.closed?'断开总开关':'闭合总开关'));
 if(['branch','allSwitches'].includes(p.control))controls.push(button('b2',s.b2?'断开支路 S₂':'闭合支路 S₂'));
 if(p.control==='allSwitches')controls.push(button('b1',s.b1?'断开支路 S₁':'闭合支路 S₁'));
 if(p.control==='topology')controls.push(button('mode',s.mode==='series'?'切换并联':'切换串联'));
 if(p.control==='fault')controls.push(select('fault','R₂状态',s.fault,[['normal','正常'],['open','断路'],['short','被导线短接']]));
 if(p.control==='resistance')controls.push(range('r2','R₂ / Ω',s.r2,5,30));
 if(p.control==='voltage')controls.push(range('U','电源电压 / V',s.U,1,6,.5));
  return {picture:circuitDrawing(s,{...p,variable:p.control==='resistance'},q),metrics:p.loadLamp?'':stats([['电源 U',fmt(m.U)+' V'],['干路 I',fmt(m.I)+' A'],['U₁ / U₂',fmt(m.U1)+' / '+fmt(m.U2)+' V'],['I₁ / I₂',fmt(m.I1)+' / '+fmt(m.I2)+' A']]),controls:controls.join(''),caption:p.loadLamp?'灯泡发光仅示意通断，不比较实际亮度。':`R₁=${s.r1} Ω；R₂=${s.r2} Ω；R总=${fmt(m.R)} Ω`,data:m};
}
function renderModel(p,s,q){
 let result={picture:'',controls:'',metrics:'',caption:'',data:{}};const stage=Math.min(q/3,1);
 switch(p.scene){
 case 'advanced-circuit':return AdvancedCircuits.render(p,s,q);
 case 'circuit':return circuitScene(p,s,q);
 case 'concept':result.picture='<div class="concept-flow">'+p.labels.map((t,i)=>`<div class="concept-tile ${q>=i+1?'lit':''}"><small>0${i+1}</small><b>${t}</b></div>`).join('')+'</div>';break;
 case 'charge':{
  const moved=Math.min(q/2,1),n=p.contact?8:6,left=p.contact?5:3,electrons=Array.from({length:n},(_,i)=>{let x=i<left?(p.contact?115+i*40:140+i*55):450+(i-left)*55;if(i===left-1)x+=(615-x)*moved;return `<g class="electron" data-moving="${i===left-1}" data-origin="${i===left-1?(p.contact?115+i*40:140+i*55):x}"><circle cx="${x}" cy="200" r="18" fill="${teal}"/>${tx(x,207,'−',24,'white')}</g>`;}).join('');
  result.picture=svg(`<rect x="80" y="80" width="270" height="220" rx="18" fill="#edf7f5"/><rect x="410" y="80" width="270" height="220" rx="18" fill="#fff4e9"/>${tx(215,125,'物体甲：固定正电荷 +3')}${tx(545,125,'物体乙：固定正电荷 +3')}${p.contact?line(350,200,410,200):''}${electrons}${arrow(325,180,405,180)}${tx(380,355,p.contact?'相同金属体接触分配的简化示例':'简化模型：只转移电子，正电荷保持原位',24)}`);
  result.metrics=stats([['甲净电荷',moved===1?(p.contact?'−1份':'+1份'):moved===0?(p.contact?'−2份':'0'):'转移中'],['乙净电荷',moved===1?'−1份':moved===0?'0':'转移中'],['系统净电荷',p.contact?'−2份':'0']]);result.data={electrons:n,positive:6,totalCharge:p.contact?-2:0};break;}
 case 'force':{
  const repel=s.charge===-1,neutral=s.charge===0;
  result.picture=svg(`<g data-motion="left-charge"><circle cx="250" cy="190" r="55" fill="#edf7f5" stroke="${teal}" stroke-width="3"/>${tx(250,208,'−',60)}</g><g data-motion="right-charge"><circle cx="510" cy="190" r="55" fill="#edf7f5" stroke="${teal}" stroke-width="3"/>${neutral?tx(485,180,'+',30)+tx(485,215,'+',30)+tx(535,180,'−',30)+tx(535,215,'−',30):tx(510,208,repel?'−':'+',60)}</g>${repel?arrow(220,290,160,290)+arrow(540,290,600,290):arrow(220,290,300,290)+arrow(540,290,460,290)}${tx(380,355,neutral?'电荷分布偏移，右侧整体仍中性':repel?'同种：排斥':'异种：吸引',27)}`);
  result.controls=select('charge','右侧物体',String(s.charge),[['-1','负电'],['1','正电'],['0','中性轻小物体']]);result.caption=neutral?'带电体可吸引中性轻小物体；图中只表示电荷分布变化，不表示产生新电荷。':'仅凭吸引不能唯一判断电荷种类。';break;}
 case 'scope':{
  const sign=s.charge===1?'+':'−';
  result.picture=svg(`<rect x="210" y="145" width="340" height="210" rx="30" fill="none" stroke="${ink}" stroke-width="3"/>${line(380,80,380,210)}<circle cx="380" cy="65" r="30" fill="#cbdadb" stroke="${ink}" stroke-width="3"/><g data-motion="rod"><rect x="75" y="47" width="180" height="36" rx="12" fill="#edf7f5" stroke="${teal}" stroke-width="2"/>${[100,140,180,220].map((x,i)=>`<text x="${x}" y="73" font-size="25" data-rod-charge="${i}">${sign}</text>`).join('')}</g><g data-motion="foil-left">${line(380,210,377,325,orange,7)}<text data-foil-charge="left" x="350" y="282" font-size="28">${sign}</text></g><g data-motion="foil-right">${line(380,210,383,325,orange,7)}<text data-foil-charge="right" x="395" y="282" font-size="28">${sign}</text></g><text data-motion="scope-status" x="380" y="390" text-anchor="middle" font-size="24"></text>`);
  result.controls=select('charge','接触体净电荷',String(s.charge),[['-1','负电'],['1','正电']]);result.caption='符号表示净电荷份额；正电不是质子移动。只作接触分配与张角示意，不作定量测量。';break;}
 case 'symbols':result.picture=svg(battery(130,100,3)+sw(350,100,false)+lamp(580,100)+resistor(130,280)+meter(350,280,'A')+meter(580,280,'V')+tx(350,360,'连接线：直线转角清楚，连接处有实心节点',24));break;
 case 'current':result.picture=svg(path('M100 80H270 M350 80H650V290H395 M365 290H100V80')+resistor(310,80,'用电器')+battery(380,290,3)+arrow(440,50,510,50)+tx(520,30,'电流',23)+`<circle data-motion="electron-current" cx="${530-(q%1)*90}" cy="80" r="9" fill="${orange}"/>`+line(525,120,450,120,orange)+`<path d="M460 112L450 120L460 128" fill="none" stroke="${orange}" stroke-width="3"/>`+tx(490,160,'电子定向移动',23,orange)+tx(380,380,'外电路：电流与金属电子定向移动方向相反',23));break;
 case 'short':result.picture=svg(path('M130 100H630V290H395 M365 290H130V100')+battery(380,290,3)+tx(380,160,'没有用电器限制电流',30,orange)+tx(380,210,'电源短路：禁止实物尝试',30,orange));break;
 case 'nodes':result.picture=svg(path('M100 60H325 M355 60H620V290 M100 60V290 M100 185H300 M380 185H620 M100 290H300 M380 290H620')+battery(340,60,6)+resistor(340,185,'R₁')+resistor(340,290,'R₂')+dot(100,185)+dot(620,185)+tx(70,205,'A',28)+tx(660,205,'B',28)+tx(380,380,'A、B 之间两条负载支路；上方是电源支路',23));break;
 case 'doorbell':result.picture=svg(path('M95 110H185 M235 110H325V230H185 M235 230H95V110 M325 170H460 M510 170H640V330H395 M365 330H95V170')+sw(210,110,q>=1,'S₁')+sw(210,230,q>=2,'S₂')+lamp(485,170,q>=1?.7:0)+battery(380,330,3)+dot(95,170)+dot(325,170)+tx(485,225,'门铃（负载示意）',22));break;
 case 'meter-error':{
  result.picture=svg(path('M65 100H157 M203 100H300V300H195 M165 300H65V100')+meter(180,100,'V')+battery(180,300,3)+tx(180,55,'错误：V 串入主回路',23,orange)+tx(180,200,'理想电压表使 I≈0',22)+path('M435 100H527 M573 100H690V300H575 M545 300H435V100')+meter(550,100,'A')+battery(560,300,3)+tx(555,55,'错误：A 直接跨电源',23,orange)+tx(555,200,'近似电源短路',25,orange)+tx(380,390,'错误接法辨析图，禁止按右图进行实物接线',23,orange));
  result.caption='电流表内阻很小、电压表内阻很大；错误接线只作静态辨析。';break;}
 case 'network-combo':{
  const rp=1/(1/s.r1+1/s.r2),I=s.U/(rp+10),Uab=I*rp;
  result.picture=svg(path('M100 80H260 M340 80H510V260H580 M660 260H700V330H315 M285 330H100V80 M100 190H260 M340 190H510')+resistor(300,80,'R₁')+resistor(300,190,'R₂')+resistor(620,260,'R₃')+battery(300,330,s.U)+dot(100,190)+dot(510,190)+tx(76,185,'A',25)+tx(535,185,'B',25)+arrow(130,50,190,50)+arrow(130,160,190,160)+arrow(540,295,590,295));
  result.metrics=stats([['R₁∥R₂',fmt(rp)+' Ω'],['再串联 R₃','10 Ω'],['干路 I',fmt(I)+' A']]);result.caption='先辨认 A、B 间的并联部分，再与 R₃ 串联。';result.data={R:rp+10,I,Uab,I1:Uab/s.r1,I2:Uab/s.r2};break;}
 case 'meter':{
  const max=Number(s.range),value=max*s.ticks/30;let g='';for(let i=0;i<=30;i++){let a=Math.PI+(i/30)*Math.PI,x=380+235*Math.cos(a),y=315+235*Math.sin(a),xx=380+(i%5===0?215:224)*Math.cos(a),yy=315+(i%5===0?215:224)*Math.sin(a);g+=line(x,y,xx,yy,ink,2);if(i%10===0)g+=tx(380+265*Math.cos(a),322+265*Math.sin(a),fmt(i/30*max),24);}
  const a=Math.PI+s.ticks/30*Math.PI;g+=line(380,315,380+200*Math.cos(a),315+200*Math.sin(a),orange,4)+dot(380,315)+tx(380,300,p.kind,38)+tx(380,380,'量程 '+max+' '+p.kind+' · 30小格',25);
  result.picture=svg(g);result.metrics=stats([['分度值',fmt(max/30)+' '+p.kind],['读数',fmt(value)+' '+p.kind]]);result.controls=select('range','量程',String(s.range),(p.kind==='A'?['0.6','3']:['3','15']).map(x=>[x,x+' '+p.kind]))+range('ticks','指针格数',s.ticks,0,30);result.data={max,value,division:max/30};break;}
 case 'wire':{
  const R=10*s.length/s.area;result.picture=svg(`<rect x="80" y="${205-15*s.area}" width="${180*s.length}" height="${30*s.area}" fill="#cbdadb" stroke="${ink}" stroke-width="3"/>${tx(380,85,'同材料、同温度的导体示意',28)}${tx(380,325,'长度倍数 '+s.length+'；横截面积倍数 '+s.area,26)}${tx(380,370,'面积增大时图示厚度仅作提示',21)}`);result.controls=range('length','长度倍数',s.length,1,3,.5)+range('area','横截面积倍数',s.area,1,3,.5);result.metrics=stats([['模型电阻',fmt(R)+' Ω'],['保持条件','同材料、同温度']]);result.data={R};break;}
 case 'rheostat':{
  const x=120+520*s.pos,R=Physics.rheostat(s.pos,s.terminal);let start=s.terminal.startsWith('A')?120:x,end=s.terminal.startsWith('A')?x:640;if(s.terminal==='AB'){start=120;end=640;}if(s.terminal==='CD'){start=end=120;}
  result.picture=svg(line(120,100,640,100)+`<rect x="120" y="230" width="520" height="32" fill="white" stroke="${ink}" stroke-width="3"/><rect x="${start}" y="232" width="${end-start}" height="28" fill="#b2d8cf"/>`+line(x,100,x,220,orange,4)+`<path d="M${x-10} 205L${x} 230L${x+10} 205" fill="${orange}"/>`+dot(120,100)+dot(640,100)+dot(120,246)+dot(640,246)+tx(95,80,'C')+tx(665,80,'D')+tx(95,285,'A')+tx(665,285,'B')+tx(x+18,185,'P',25,orange)+tx(380,340,'接线 '+s.terminal+' · 绿色为有效电阻丝',26));
  result.controls=select('terminal','接线柱',s.terminal,['AC','BC','AD','BD','AB','CD'].map(x=>[x,x]))+range('pos','滑片位置（左→右）',s.pos,0,1,.05);result.metrics=stats([['最大电阻','20 Ω'],['接入电阻',fmt(R)+' Ω']]);result.data={R};break;}
 case 'ohm':{
  const U=6,R=s.ohmR,rp=s.rp,m=Physics.circuit({U,r1:R,r2:rp,mode:'series',closed:s.closed}),I=m.I,Ur=m.U1;
  result.picture=circuitDrawing({U,r1:R,r2:rp,mode:'series',closed:s.closed}, {meter:true,variable:true},q);
  result.controls=button('closed',s.closed?'断开开关':'闭合开关')+range('rp','变阻器 R₂ / Ω',rp,0,50,.5)+(p.mode==='resistance'?select('ohmR','研究电阻 R₁',String(R),['5','10','15'].map(x=>[x,x+' Ω'])).replace('<select ',`<select ${s.closed?'disabled ':''}`):'')+button('record','记录数据');
  const records=s.records||[];
  result.caption=s.feedback|| (records.length?'已记录（理想模型）'+records.map(x=>`(${fmt(x.U)}V,${fmt(x.I)}A)`).join(' '):'先断开开关才能更换 R₁；记录至多3组，重播清空。');
  result.metrics=stats([['U₁',fmt(Ur)+' V'],['I',fmt(I)+' A'],['U₁/I',I?fmt(Ur/I)+' Ω':'—'],['目标3 V',Math.abs(Ur-3)<.01?'已达到':'尚未达到']]);result.data={I,U:Ur,R};break;}
 case 'graph':{
  const nonlinear=p.graph==='lamp',compare=p.graph==='compare',points=nonlinear?[[0,0],[.5,.13],[1,.19],[1.5,.235],[2,.27],[2.5,.3]]:[[0,0],[1,.1],[2,.2],[3,.3]];
  const reversed=compare&&s.axis==='UI',plot=([U,I])=>reversed?[120+I*1500,325-U*80]:[120+U*150,325-I*800];
  let g=path('M120 55V325H650')+tx(85,60,reversed?'U / V':'I / A',22)+tx(665,350,reversed?'I / A':'U / V',22);
  for(let i=0;i<=3;i++)g+=tx(120+i*150,355,reversed?fmt(i*.1):i,22)+tx(80,332-i*80,reversed?i:fmt(i*.1),20);
  g+=`<polyline points="${points.map(plot).join(' ')}" fill="none" stroke="${teal}" stroke-width="4"/>`;
  if(compare){const [x,y]=plot([3,.15]);g+=line(120,325,x,y,orange,4)+tx(reversed?355:565,reversed?75:190,'20 Ω',22,orange)+tx(560,75,'10 Ω',22,teal);result.controls=select('axis','坐标轴',reversed?'UI':'IU',[['IU','横 U、纵 I'],['UI','横 I、纵 U']]);}
  for(const [U,I]of points){const [x,y]=plot([U,I]);g+=`<circle cx="${x}" cy="${y}" r="5" fill="${teal}"/>`;}
  result.picture=svg(g);result.caption=nonlinear?'灯丝示例数据（非实测），不是过原点直线。':compare?'定值电阻理想数据；切换坐标后，同一组数据的斜率含义不同。':'定值电阻理想数据；横轴电压，纵轴电流。';
  result.metrics='<table class="data-table"><tr><th>U / V</th>'+points.slice(1).map(x=>'<td>'+x[0]+'</td>').join('')+'</tr><tr><th>I / A</th>'+points.slice(1).map(x=>'<td>'+fmt(x[1],3)+'</td>').join('')+'</tr></table>';result.data={axis:reversed?'UI':'IU'};break;}
 case 'safety':{
  const s2={...s,mode:'series'},m=Physics.circuit(s2),safe=m.I<=.400001&&(p.currentOnly||m.U2<=3.00001);
  result.picture=circuitDrawing(s2,{meter:true,variable:true},q);result.controls=range('r2','R₂ / Ω',s2.r2,0,20,.5);result.metrics=stats([['I≤0.4 A',fmt(m.I)+' A'],[p.currentOnly?'U₂（未加限制）':'U₂≤3 V',fmt(m.U2)+' V'],['是否同时满足',safe?'是':'否']]);result.data={...m,safe};break;}
 case 'lamp':{
  const U=s.lampU,I=Physics.lamp(U),P=U*I,R=I?U/I:0,Rp=I?(6-U)/I:Infinity;
  result.picture=circuitDrawing({U:6,r1:R,r2:Rp,mode:'series',closed:true},{meter:true,variable:true,loadLamp:false,lampR1:true},q).replace(resistor(320,80,'R₁'),lamp(320,80,P/.75)+line(280,80,295,80)+line(345,80,360,80));result.controls=range('lampU','调节灯泡电压 / V',U,.5,2.5,.1);result.metrics=stats([['灯 U',fmt(U)+' V'],['灯 I',fmt(I,3)+' A'],['灯 P',fmt(P,3)+' W'],['灯 R',fmt(R)+' Ω']]);result.caption='2.5 V、0.75 W灯泡的示例曲线；变阻器对应 '+fmt(Rp)+' Ω。';result.data={U,I,P,R,Rp};break;}
 case 'power':{
  const P=p.power||6,t=stage*(p.duration||60),W=P*t;result.picture=svg(`<rect x="100" y="110" width="560" height="70" fill="white" stroke="${ink}" stroke-width="3"/><rect x="103" y="113" data-motion="energy-bar" width="${554*stage}" height="64" fill="#b2d8cf"/>${tx(380,80,p.power?'1000 W × 720 s＝720000 J':'12 V × 0.5 A＝6 W',32)}<text data-motion="energy-time" x="380" y="240" text-anchor="middle" font-size="30"></text><text data-motion="energy-value" x="380" y="310" text-anchor="middle" font-size="36" fill="${teal}"></text>`);result.data={t,W,P};result.caption='恒定电压、电流的理想模型；累计能量随时间增加。';break;}
 case 'joule':{
  const mode=p.mode||'R',I1=.5,I2=mode==='I'?1:.5,R1=mode==='calc'?20:10,R2=mode==='R'?20:R1,t=stage*(mode==='calc'?120:60),Q1=Physics.heat(I1,R1,t),Q2=Physics.heat(I2,R2,t);let g='';
  for(const [x,I,R,Q,label]of [[200,I1,R1,Q1,'甲'],[560,I2,R2,Q2,'乙']]){let dh=Q/20;g+=`<path d="M${x-95} 125V330H${x+95}V125" fill="#edf7f5" stroke="${ink}" stroke-width="3"/><rect data-heat="${label}" x="${x+60}" y="${310-dh*4}" width="18" height="${dh*4}" fill="${orange}"/>`+resistor(x-20,235,R+' Ω')+path(`M${x-60} 235V110 M${x+20} 235V110`)+`<text data-heat-text="${label}" x="${x}" y="360" text-anchor="middle" font-size="24"></text>`+tx(x,390,label+': '+I+' A',22);}
  if(mode==='R')g+=path('M140 110V50H365 M395 50H580V110 M220 110H500')+battery(380,50,I1*(R1+R2)).replace('y="103"','y="14"');
  else for(const [x,U]of [[200,I1*R1],[560,I2*R2]])g+=path(`M${x-60} 110V50H${x-15} M${x+15} 50H${x+20}V110`)+battery(x,50,U);
  result.picture=svg(g);result.metrics=stats([['通电时间',fmt(t)+' s'],['Q甲',fmt(Q1)+' J'],['Q乙',fmt(Q2)+' J']]);result.caption=(mode==='R'?'同一串联回路':'独立低压回路')+'；等热容20 J/℃，忽略散热，时间压缩演示。';result.data={I1,I2,R1,R2,t,Q1,Q2};break;}
 case 'home':{
  const device=[1000,2100,3200][s.load],loads=device+(q>=1?100:0),I=loads/220;let g=line(100,70,145,70,orange)+line(290,70,680,70,orange)+line(100,320,650,320,ink)+line(100,365,700,365,teal)+tx(60,78,'L',26,orange)+tx(60,328,'N',26)+tx(60,373,'PE',24,teal);
  g+=`<rect x="145" y="46" width="145" height="48" fill="white" stroke="${ink}" stroke-width="2"/>`+tx(218,77,'保护装置',22)+path('M360 70V120 M360 170V225 M360 275V320 M560 70V160 M560 240V320')+`<g transform="translate(360 145) rotate(90)">${sw(0,0,q>=1,'')}</g>`+lamp(360,250,q>=1?.7:0)+dot(360,70)+dot(360,320)+resistor(560,200,'用电器',true)+`<rect x="490" y="140" width="140" height="125" rx="12" fill="none" stroke="${teal}" stroke-width="3"/>`+line(630,220,700,220,teal)+line(700,220,700,365,teal)+dot(700,365)+tx(332,128,'火线开关',20)+tx(568,290,'金属外壳接PE',20,teal);
  result.picture=svg(g);result.caption='灯100 W，右侧负荷'+device+' W；按纯电阻近似，PE不流工作电流。';if(p.control==='loads')result.controls=button('load','切换总负荷');result.metrics=stats([['近似电压','220 V'],['示例总功率',loads+' W'],['总电流（近似）',fmt(I)+' A']]);result.data={P:loads,I};break;}
 }
 return result;
}

function updateMotion(root,p,s,q,data){
 const stage=Math.min(q/3,1),find=k=>root.querySelector(`[data-motion="${k}"]`),attr=(e,k,v)=>{if(e&&e.getAttribute(k)!==String(v))e.setAttribute(k,v);},text=(e,v)=>{if(e&&e.textContent!==v)e.textContent=v;};
 for(const k of ['current1','current2'])attr(find(k),'transform',`translate(${q%1*55} 0)`);
 attr(find('electron-current'),'cx',530-q%1*90);
 if(p.scene==='charge'){
  const e=root.querySelector('[data-moving="true"]'),x=Number(e.dataset.origin),moved=Math.min(q/2,1);attr(e,'transform',`translate(${(615-x)*moved} 0)`);
  const vals=root.closest('.visual').querySelectorAll('#readings b');text(vals[0],moved===1?(p.contact?'−1份':'+1份'):moved===0?(p.contact?'−2份':'0'):'转移中');text(vals[1],moved===1?'−1份':moved===0?'0':'转移中');
 }else if(p.scene==='force'){
  const d=stage*50*(s.charge===-1?1:-1);attr(find('left-charge'),'transform',`translate(${-d} 0)`);attr(find('right-charge'),'transform',`translate(${d} 0)`);
 }else if(p.scene==='scope'){
  const contact=q>=1,spread=Math.max(0,Math.min(1,q-1));attr(find('rod'),'transform',`translate(${Math.min(q,1)*95} 0)`);
  attr(find('foil-left'),'transform',`rotate(${spread*35} 380 210)`);attr(find('foil-right'),'transform',`rotate(${-spread*35} 380 210)`);
  root.querySelectorAll('[data-foil-charge]').forEach(e=>attr(e,'visibility',contact?'visible':'hidden'));
  root.querySelectorAll('[data-rod-charge]').forEach(e=>attr(e,'visibility',!contact||+e.dataset.rodCharge<2?'visible':'hidden'));
  text(find('scope-status'),q<1?'未接触：验电器中性，箔片合拢':q<2?'接触：电子转移，净电荷重新分布':'两箔同种电荷，排斥张开');
  data.rodCharge=(s.charge===1?1:-1)*(contact?2:4);data.foilCharge=(s.charge===1?1:-1)*(contact?2:0);
 }else if(p.scene==='power'){
  data.t=stage*(p.duration||60);data.P=p.power||6;data.W=data.P*data.t;attr(find('energy-bar'),'width',554*stage);text(find('energy-time'),'工作时间 '+fmt(data.t,1)+' s');text(find('energy-value'),'累计电能 '+fmt(data.W,0)+' J');
 }else if(p.scene==='joule'){
  data.t=stage*(p.mode==='calc'?120:60);data.Q1=Physics.heat(data.I1,data.R1,data.t);data.Q2=Physics.heat(data.I2,data.R2,data.t);
  for(const [label,Q]of [['甲',data.Q1],['乙',data.Q2]]){const e=root.querySelector(`[data-heat="${label}"]`);attr(e,'y',310-Q/5);attr(e,'height',Q/5);text(root.querySelector(`[data-heat-text="${label}"]`),fmt(Q,0)+' J · ΔT='+fmt(Q/20,1)+' ℃');}
  const vals=root.closest('.visual').querySelectorAll('#readings b');[fmt(data.t,1)+' s',fmt(data.Q1,0)+' J',fmt(data.Q2,0)+' J'].forEach((v,i)=>text(vals[i],v));
 }
}
