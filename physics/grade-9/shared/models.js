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
 lamp(U){const points=[[0,0],[.5,.13],[1,.19],[1.5,.235],[2,.27],[2.5,.3]];let k=points.findIndex(x=>x[0]>=U);if(k<=0)return 0;const [x,y]=points[k-1],[xx,yy]=points[k];return y+(yy-y)*(U-x)/(xx-x);},
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
const meter=(x,y,letter,positive='left')=>`<circle cx="${x}" cy="${y}" r="23" stroke="${ink}" stroke-width="3" fill="white"/>${tx(x,y+8,letter,25)}${tx(x+(positive==='left'?-32:32),y-18,'+',18)}`;
const battery=(x,y,U)=>`${line(x-15,y-30,x-15,y+30)}${line(x+15,y-16,x+15,y+16)}${tx(x-32,y-25,'+',21)}${tx(x+33,y-22,'−',21)}${tx(x,y+53,U+' V',24)}`;
const sw=(x,y,closed,label='S')=>`${dot(x-25,y)}${dot(x+25,y)}${line(x-25,y,x+25,closed?y:y-22)}${tx(x,y-32,label,20)}`;
const arrow=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${teal}" stroke-width="4" marker-end="url(#arrowhead)"/>`;
const fmt=(n,d=2)=>Number.isFinite(n)?Number(n.toFixed(d)).toString():'∞';
const stats=items=>`<div class="readings">${items.map(([k,v])=>`<span>${k}<b>${v}</b></span>`).join('')}</div>`;
const range=(key,label,value,min,max,step=1)=>`<label class="slider-label">${label}<input aria-label="${label}" data-var="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
const button=(key,label,val)=>`<button data-action="${key}"${val!==undefined?` data-value="${val}"`:''}>${label}</button>`;
const select=(key,label,value,items)=>`<label>${label} <select aria-label="${label}" data-var="${key}">${items.map(([v,t])=>`<option value="${v}" ${v===value?'selected':''}>${t}</option>`).join('')}</select></label>`;
function initial(p){return {U:6,r1:10,r2:p.scene==='safety'?10:20,mode:p.mode||'series',closed:true,b1:true,b2:true,fault:p.initialFault||'normal',pos:.5,terminal:p.terminal||'AC',range:p.kind==='A'?.6:3,ticks:18,charge:-1,length:1,area:1,ohmR:10,rp:10,lampU:2.5,load:0,...p.initial};}
function circuitDrawing(s,p={},phase=0){
 const m=Physics.circuit(s),parallel=s.mode==='parallel',single=s.mode==='single';let g='';
 const load=(x,y,label,on,vertical=false)=>p.loadLamp?lamp(x,y,on?.65:0)+tx(x+(vertical?-55:0),y+(vertical?8:-36),label.replace('R','L')):resistor(x,y,label,vertical);
 if(parallel){
  g+=path('M100 80V335H285 M315 335H640V80 M100 80H155 M205 80H310 M390 80H640 M100 200H155 M205 200H310 M390 200H640');
  g+=sw(180,80,s.b1,'S₁')+sw(180,200,s.b2,'S₂')+load(350,80,'R₁',m.I1)+load(350,200,'R₂',m.I2)+battery(300,335,s.U);
  if(p.loadLamp)g+=line(310,80,325,80)+line(375,80,390,80)+line(310,200,325,200)+line(375,200,390,200);
  g+=`<rect x="470" y="325" width="60" height="20" fill="#f4f8f8"/>`+sw(500,335,s.closed,'S');
  g+=dot(100,200)+dot(640,200)+tx(78,190,'A')+tx(665,190,'B');
  if(p.meter){g+=meter(510,80,'A')+meter(510,200,'A');}
  if(m.I1)g+=arrow(220,54,265,54);if(m.I2)g+=arrow(220,174,265,174);
 }else{
  g+=path('M85 80H130 M180 80H270 M350 80H630V305H315 M285 305H85V80');
  g+=sw(155,80,s.closed)+load(310,80,single?'R':'R₁',m.I1)+battery(300,305,s.U);
  if(p.loadLamp)g+=line(270,80,285,80)+line(335,80,350,80);
  if(!single){g+=`<rect x="612" y="155" width="36" height="90" fill="#f4f8f8"/>`;
   if(s.fault==='open')g+=line(630,155,630,178)+line(630,222,630,245)+dot(630,178)+dot(630,222)+tx(685,205,'断点',21);
   else {g+=line(630,155,630,p.loadLamp?175:160)+load(630,200,'R₂',m.I2,true)+line(630,p.loadLamp?225:240,630,245);}
   if(s.fault==='short')g+=path('M630 145H710V255H630')+dot(630,145)+dot(630,255)+tx(703,285,'旁路',19);
   if(p.variable)g+=`<path d="M700 165L642 210" fill="none" stroke="${orange}" stroke-width="3"/><path d="M644 198L642 210L655 209" fill="none" stroke="${orange}" stroke-width="3"/>`;
  }
  if(p.meter){g+=meter(465,80,'A');g+=path('M250 80V158H370V80')+dot(250,80)+dot(370,80)+meter(310,158,'V');
   if(!single)g+=path('M630 140H510V260H630')+dot(630,140)+dot(630,260)+meter(510,200,'V','right')+tx(468,205,'V₂',19);
  }
  if(m.I)g+=arrow(380,48,425,48);
 }
 if(m.I){let x=220+((phase%1)*50);g+=`<circle cx="${x}" cy="${parallel?80:80}" r="5" fill="${teal}"/>`;}
 return svg(g,'规范直流电路：'+s.mode)+'<p class="diagram-caption">'+(parallel?'两个公共节点 · 支路分别闭合':single?'电流表串联 · 电压表并联（有表时）':'单一路径 · V₂ 跨接 R₂（有表时）')+'</p>';
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
 case 'circuit':return circuitScene(p,s,q);
 case 'concept':result.picture='<div class="concept-flow">'+p.labels.map((t,i)=>`<div class="concept-tile ${q>=i+1?'lit':''}"><small>0${i+1}</small><b>${t}</b></div>`).join('')+'</div>';break;
 case 'charge':{
  const moved=Math.min(q/2,1),n=p.contact?8:6,left=p.contact?5:3,electrons=Array.from({length:n},(_,i)=>{let x=i<left?(p.contact?115+i*40:140+i*55):450+(i-left)*55;if(i===left-1)x+=(615-x)*moved;return `<g class="electron" data-moving="${i===left-1}"><circle cx="${x}" cy="200" r="18" fill="${teal}"/>${tx(x,207,'−',24,'white')}</g>`;}).join('');
  result.picture=svg(`<rect x="80" y="80" width="270" height="220" rx="18" fill="#edf7f5"/><rect x="410" y="80" width="270" height="220" rx="18" fill="#fff4e9"/>${tx(215,125,'物体甲：固定正电荷 +3')}${tx(545,125,'物体乙：固定正电荷 +3')}${p.contact?line(350,200,410,200):''}${electrons}${arrow(325,180,405,180)}${tx(380,355,p.contact?'相同金属体接触分配的简化示例':'简化模型：只转移电子，正电荷保持原位',24)}`);
  result.metrics=stats([['甲净电荷',moved===1?(p.contact?'−1份':'+1份'):moved===0?(p.contact?'−2份':'0'):'转移中'],['乙净电荷',moved===1?'−1份':moved===0?'0':'转移中'],['系统净电荷',p.contact?'−2份':'0']]);result.data={electrons:n,positive:6,totalCharge:p.contact?-2:0};break;}
 case 'force':{
  const repel=s.charge===-1,d=stage*50*(repel?1:-1);result.picture=svg(`<circle cx="${250-d}" cy="190" r="55" fill="#edf7f5" stroke="${teal}" stroke-width="3"/><circle cx="${510+d}" cy="190" r="55" fill="#edf7f5" stroke="${teal}" stroke-width="3"/>${tx(250-d,208,'−',60)}${tx(510+d,208,repel?'−':'+',60)}${repel?arrow(220,290,160,290)+arrow(540,290,600,290):arrow(220,290,300,290)+arrow(540,290,460,290)}${tx(380,355,repel?'同种：排斥':'异种：吸引',30)}`);result.controls=button('charge','切换右侧电荷');break;}
 case 'scope':{
  const dx=10+stage*95;result.picture=svg(`<rect x="210" y="140" width="340" height="220" rx="30" fill="none" stroke="${ink}" stroke-width="3"/>${line(380,80,380,210)}<circle cx="380" cy="65" r="30" fill="#cbdadb" stroke="${ink}" stroke-width="3"/>${line(380,210,380-dx,325,orange,8)}${line(380,210,380+dx,325,orange,8)}${tx(350-dx/2,270,'−',30)}${tx(410+dx/2,270,'−',30)}${tx(600,250,'同种电荷排斥',24)}`);result.caption='箔片夹角仅表示变化趋势，不是定量刻度。';break;}
 case 'symbols':result.picture=svg(battery(130,100,3)+sw(350,100,false)+lamp(580,100)+resistor(130,280)+meter(350,280,'A')+meter(580,280,'V')+tx(350,360,'连接线：直线转角清楚，连接处有实心节点',24));break;
 case 'current':result.picture=svg(path('M100 80H270 M350 80H650V290H395 M365 290H100V80')+resistor(310,80,'用电器')+battery(380,290,3)+arrow(440,50,510,50)+tx(520,30,'电流',23)+`<circle cx="${530-(q%1)*90}" cy="80" r="9" fill="${orange}"/>`+line(525,120,450,120,orange)+`<path d="M460 112L450 120L460 128" fill="none" stroke="${orange}" stroke-width="3"/>`+tx(490,160,'电子定向移动',23,orange)+tx(380,380,'外电路：电流与金属电子定向移动方向相反',23));break;
 case 'short':result.picture=svg(path('M130 100H630V290H395 M365 290H130V100')+battery(380,290,3)+tx(380,160,'没有用电器限制电流',30,orange)+tx(380,210,'电源短路：禁止实物尝试',30,orange));break;
 case 'nodes':result.picture=svg(path('M100 70H325 M355 70H620V270 M100 70V270 M100 170H300 M380 170H620 M100 270H300 M380 270H620')+battery(340,70,6)+resistor(340,170,'R₁')+resistor(340,270,'R₂')+dot(100,170)+dot(620,170)+tx(70,190,'A',28)+tx(660,190,'B',28)+tx(380,380,'A、B 之间两条负载支路；上方是电源支路',23));break;
 case 'doorbell':result.picture=svg(path('M95 110H185 M235 110H325V230H185 M235 230H95V110 M325 170H460 M510 170H640V330H395 M365 330H95V170')+sw(210,110,q>=1,'S₁')+sw(210,230,q>=2,'S₂')+lamp(485,170,q>=1?.7:0)+battery(380,330,3)+dot(95,170)+dot(325,170)+tx(485,225,'门铃（负载示意）',22));break;
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
  const U=6,R=s.ohmR,rp=s.rp,I=U/(R+rp),Ur=I*R;
  result.picture=circuitDrawing({U,r1:R,r2:rp,mode:'series',closed:true}, {meter:true,variable:true},q);result.caption='R₁为研究电阻；R₂为串联变阻器，理想电表。';
  result.controls=range('rp','变阻器 R₂ / Ω',rp,0,30,.5)+(p.mode==='resistance'?select('ohmR','研究电阻 R₁',String(R),['5','10','15'].map(x=>[x,x+' Ω'])):'');
  result.metrics=stats([['U₁',fmt(Ur)+' V'],['I',fmt(I)+' A'],['U₁/I',fmt(Ur/I)+' Ω'],['目标3 V',Math.abs(Ur-3)<.01?'已达到':'尚未达到']]);result.data={I,U:Ur,R};break;}
 case 'graph':{
  const nonlinear=p.graph==='lamp',compare=p.graph==='compare',points=nonlinear?[[0,0],[.5,.13],[1,.19],[1.5,.235],[2,.27],[2.5,.3]]:[[0,0],[1,.1],[2,.2],[3,.3]];
  let g=path('M120 55V325H650')+tx(85,60,'I / A',22)+tx(665,350,'U / V',22);for(let i=0;i<=3;i++)g+=tx(120+i*150,355,i,22)+tx(80,332-i*80,fmt(i*.1),20);
  g+=`<polyline points="${points.map(([x,y])=>[120+x*150,325-y*800]).join(' ')}" fill="none" stroke="${teal}" stroke-width="4"/>`;
  if(compare)g+=line(120,325,570,205,orange,4)+tx(565,190,'20 Ω',22,orange)+tx(560,75,'10 Ω',22,teal);
  for(const [x,y]of points)g+=`<circle cx="${120+x*150}" cy="${325-y*800}" r="5" fill="${teal}"/>`;
  result.picture=svg(g);result.caption=nonlinear?'灯丝示例数据（非实测），不是过原点直线。':'定值电阻理想数据；横轴电压，纵轴电流。';
  result.metrics='<table class="data-table"><tr><th>U / V</th>'+points.slice(1).map(x=>'<td>'+x[0]+'</td>').join('')+'</tr><tr><th>I / A</th>'+points.slice(1).map(x=>'<td>'+fmt(x[1],3)+'</td>').join('')+'</tr></table>';break;}
 case 'safety':{
  const s2={...s,mode:'series'},m=Physics.circuit(s2),safe=m.I<=.400001&&m.U2<=3.00001;
  result.picture=circuitDrawing(s2,{meter:true,variable:true},q);result.controls=range('r2','R₂ / Ω',s2.r2,0,20,.5);result.metrics=stats([['I≤0.4 A',fmt(m.I)+' A'],['U₂≤3 V',fmt(m.U2)+' V'],['是否同时满足',safe?'是':'否']]);result.data={...m,safe};break;}
 case 'lamp':{
  const U=s.lampU,I=Physics.lamp(U),P=U*I,R=I?U/I:0,Rp=I?(6-U)/I:Infinity;
  let g=path('M80 80H130 M180 80H285 M335 80H630V305H395 M365 305H80V80')+sw(155,80,true)+lamp(310,80,P/.75)+meter(470,80,'A')+battery(380,305,6)+`<rect x="615" y="160" width="30" height="80" fill="#f4f8f8"/>`+resistor(630,200,'变阻器',true)+path('M250 80V155H370V80')+dot(250,80)+dot(370,80)+meter(310,155,'V');
  g+=`<path d="M700 165L642 210L644 198M642 210L655 209" fill="none" stroke="${orange}" stroke-width="3"/>`;
  result.picture=svg(g);result.controls=range('lampU','调节灯泡电压 / V',U,.5,2.5,.1);result.metrics=stats([['灯 U',fmt(U)+' V'],['灯 I',fmt(I,3)+' A'],['灯 P',fmt(P,3)+' W'],['灯 R',fmt(R)+' Ω']]);result.caption='2.5 V、0.75 W灯泡的示例曲线；变阻器对应 '+fmt(Rp)+' Ω。';result.data={U,I,P,R,Rp};break;}
 case 'power':{
  const t=stage*60,W=12*.5*t;result.picture=svg(`<rect x="100" y="110" width="560" height="70" fill="white" stroke="${ink}" stroke-width="3"/><rect x="103" y="113" width="${554*stage}" height="64" fill="#b2d8cf"/>${tx(380,80,'12 V × 0.5 A＝6 W',32)}${tx(380,240,'工作时间 '+fmt(t)+' s',30)}${tx(380,310,'累计电能 '+fmt(W)+' J',36,teal)}`);result.data={t,W,P:6};result.caption='恒定电压、电流的理想模型；累计能量随时间增加。';break;}
 case 'joule':{
  const mode=p.mode||'R',I1=.5,I2=mode==='I'?1:.5,R1=mode==='calc'?20:10,R2=mode==='R'?20:R1,t=stage*(mode==='calc'?120:60),Q1=Physics.heat(I1,R1,t),Q2=Physics.heat(I2,R2,t);let g='';
  for(const [x,I,R,Q,label]of [[200,I1,R1,Q1,'甲'],[560,I2,R2,Q2,'乙']]){let dh=Q/20;g+=`<path d="M${x-95} 125V330H${x+95}V125" fill="#edf7f5" stroke="${ink}" stroke-width="3"/><rect x="${x+60}" y="${310-dh*4}" width="18" height="${dh*4}" fill="${orange}"/>`+resistor(x-20,235,R+' Ω')+path(`M${x-60} 235V110 M${x+20} 235V110`)+tx(x,360,fmt(Q)+' J · ΔT='+fmt(Q/20)+' ℃',24)+tx(x,390,label+': '+I+' A',22);}
  if(mode==='R')g+=path('M140 110V50H365 M395 50H580V110 M220 110H500')+battery(380,50,I1*(R1+R2));
  else for(const [x,U]of [[200,I1*R1],[560,I2*R2]])g+=path(`M${x-60} 110V50H${x-15} M${x+15} 50H${x+20}V110`)+battery(x,50,U);
  result.picture=svg(g);result.metrics=stats([['通电时间',fmt(t)+' s'],['Q甲',fmt(Q1)+' J'],['Q乙',fmt(Q2)+' J']]);result.caption=(mode==='R'?'同一串联回路':'独立低压回路')+'；等热容20 J/℃，忽略散热，时间压缩演示。';result.data={I1,I2,R1,R2,t,Q1,Q2};break;}
 case 'home':{
  const device=[1000,2100,3200][s.load],loads=device+(q>=1?100:0),I=loads/220;let g=line(100,70,680,70,orange)+line(100,320,650,320,ink)+line(100,365,700,365,teal)+tx(60,78,'L',26,orange)+tx(60,328,'N',26)+tx(60,373,'PE',24,teal);
  g+=`<rect x="145" y="46" width="145" height="48" fill="white" stroke="${ink}" stroke-width="2"/>`+tx(218,77,'保护装置',22)+path('M360 70V120 M360 170V320 M560 70V155 M560 245V320')+`<g transform="translate(360 145) rotate(90)">${sw(0,0,q>=1,'')}</g>`+lamp(360,250,q>=1?.7:0)+dot(360,70)+dot(360,320)+resistor(560,200,'用电器',true)+`<rect x="490" y="140" width="140" height="125" rx="12" fill="none" stroke="${teal}" stroke-width="3"/>`+line(630,220,700,220,teal)+line(700,220,700,365,teal)+dot(700,365)+tx(360,110,'火线开关',20)+tx(568,290,'金属外壳接PE',20,teal);
  result.picture=svg(g);result.caption='灯100 W，右侧负荷'+device+' W；按纯电阻近似，PE不流工作电流。';if(p.control==='loads')result.controls=button('load','切换总负荷');result.metrics=stats([['近似电压','220 V'],['示例总功率',loads+' W'],['总电流（近似）',fmt(I)+' A']]);result.data={P:loads,I};break;}
 }
 return result;
}
