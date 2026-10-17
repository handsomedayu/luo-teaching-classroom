// V3.1 整改交互测试：互画连线、改错、测量追踪
// 运行：node tests/interact-circuits.cjs
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={window:{LESSON:{pages:[]}}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../physics/grade-9/electricity-03/advanced.js','utf8')+';window.AC=AdvancedCircuits;',ctx);
const A=ctx.window.AC,pages=ctx.window.LESSON.pages;
const near=(a,b,eps=1e-6)=>assert(Math.abs(a-b)<eps,`${a} vs ${b}`);
let n=0;const ok=m=>{n++;console.log('ok',n,m);};
const pg=c=>pages.find(p=>p.task==='error'&&p.cases&&p.cases.includes(c));
const convPg=id=>pages.find(p=>p.task==='convert'&&p.id===id)||pages.find(p=>p.task==='convert');
function errNet(c){const p=pg(c),s=A.initial(p);s.acCase=p.cases.indexOf(c);return {p,s,net:A.make(p,{...s,fixed:false})};}
function coordOf(net,node){const t=A.terminals(net,false).find(t=>t.node===node);assert(t,'node '+node);return [t.x,t.y];}
function mv(edge,end,toNode,net){return {op:'moveEnd',edge,end,toNode,toCoord:coordOf(net,toNode)};}
function check(c,edits){const {net}=errNet(c);const n2=A.applyEdits(net,edits);return A.checkEdit(c,n2,A.solve(n2,n2.switches||{}));}

// ---------- 一、互画连线 ----------
{
  const p=convPg();const s=A.initial(p);
  const net=A.make(p,s),tm=A.terminals(net,true),req=A.requiredWires(net,true);
  assert(req.length>0,'应有待连导线');
  // 终端去重：同一坐标只出现一次
  const keys=tm.map(t=>t.key);assert.strictEqual(new Set(keys).size,keys.length,'终端坐标去重');
  // 正确连线被接受
  const r0=req[0];const v0=A.validateWire(net,true,[],r0.n1,r0.n2);
  assert(v0.ok&&v0.push,'正确连线应被接受');ok('正确连线被接受');
  // 同一终端被拒绝，不落线
  const v1=A.validateWire(net,true,[],r0.n1,r0.n1);
  assert(!v1.ok&&!v1.push&&/同一个接线柱/.test(v1.reason));ok('同一终端拒绝且不落线');
  // 重复连线被拒绝，不落线
  const done=[{k1:'a',k2:'b',n1:r0.n1,n2:r0.n2,ok:true}];
  const v2=A.validateWire(net,true,done,r0.n1,r0.n2);
  assert(!v2.ok&&!v2.push&&/已经连好/.test(v2.reason));ok('重复连线拒绝且不落线');
  // 错误连线被拒绝，落红色虚线
  const tA=tm[0],tB=tm[tm.length-1];
  let badPair=null;
  outer:for(const a of tm)for(const b of tm){
    if(a.node===b.node)continue;
    const vv=A.validateWire(net,true,[],a.node,b.node);
    if(!vv.ok&&vv.push){badPair=[a,b,vv];break outer;}
  }
  assert(badPair,'应能找到一对错误连线');
  assert(/不需要直接连|短路/.test(badPair[2].reason));ok('错误连线拒绝并给出原因');
  // 电源短路试算：直接连 P、N
  const tP=tm.find(t=>t.node==='P'),tN=tm.find(t=>t.node==='N');
  if(tP&&tN){
    const vs=A.validateWire(net,true,[],tP.node,tN.node);
    // P、N 若本就要求直连则为正确，否则应报短路
    if(!vs.ok)assert(/短路/.test(vs.reason),'P-N 直连应报电源短路');
    ok('电源短路试算');
  }
  // 完整正确连线走 action 流程
  const s2=A.initial(p);s2.wireMode='student';s2.showRef=false;
  const net2=A.make(p,s2),tm2=A.terminals(net2,true);
  const byNode={};for(const t of tm2)byNode[t.node]=t.key;
  for(const r of A.requiredWires(net2,true)){
    A.action(s2,'ac:term',byNode[r.n1],p);
    A.action(s2,'ac:term',byNode[r.n2],p);
  }
  const shown=A.render(p,s2,3);
  assert(shown.data.done,`应全部连对 done=true（已连${shown.data.doneCount}/${shown.data.reqCount}）`);
  assert(shown.picture.includes('<svg'));ok('学生模式全连对后显示对照');
  // 撤销
  A.action(s2,'ac:wireUndo',null,p);
  assert(A.render(p,s2,3).data.doneCount===shown.data.doneCount-1);ok('撤销上根导线');
}

// ---------- 二、改错：正确改法全部通过 ----------
const goodEdits={
  ammeterParallel:net=>[mv('A错','a','b2b',net),mv('A错','b','b2c',net)],
  voltmeterSeries:net=>[mv('V错','a','A0',net),mv('V错','b','n1',net)],
  reverse:()=>[ {op:'swapMeter',edge:'V₁'} ],
  range:()=>[ {op:'chRange',edge:'A₀',value:3} ],
  switchPlace:net=>[mv('S1','a','P',net),mv('S1','b','M',net),mv('S₀','a','b1a',net),mv('S₀','b','b1b',net)],
  rheostatWrong:()=>[ {op:'reterm',edge:'L2',value:'AC'} ],
  seriesInstead:net=>[mv('L1','b','Z',net),mv('L2','a','A',net)],
  lampShort:()=>[ {op:'delWire',edge:'旁路线'} ],
  sourceShort:()=>[ {op:'delWire',edge:'危险短接'} ],
  multiError:()=>[ {op:'delWire',edge:'旁路线'},{op:'swapMeter',edge:'V₁'} ],
  oneMove:net=>[mv('V₁','a','n1',net)],
  oneDelete:()=>[ {op:'delWire',edge:'旁路线'} ],
  multiFix:net=>[mv('A错','a','b2b',net),mv('A错','b','b2c',net)],
};
for(const [c,fn] of Object.entries(goodEdits)){
  const {net}=errNet(c);const r=check(c,fn(net));
  assert(r.ok,c+' 正确改法应通过：'+r.msg);ok('改错通过 '+c);
}
// ---------- 三、改错：错误改法被拒绝 ----------
{
  let r=check('lampShort',[]);assert(!r.ok,'未改线不应通过');ok('未改线被拒绝');
  r=check('lampShort',[{op:'delWire',edge:'左导线'}]);assert(!r.ok,'删错线不应通过');ok('删错线被拒绝');
  r=check('reverse',[]);assert(!r.ok&&/反偏|接反/.test(r.msg));ok('未纠正极性被拒绝');
  r=check('range',[{op:'chRange',edge:'A₀',value:0.6}]);assert(!r.ok,'量程仍不足应被拒绝');ok('量程不足被拒绝');
  r=check('oneMove',[]);assert(!r.ok);ok('oneMove 未改被拒绝');
}
// ---------- 四、改错：限次与撤销 ----------
{
  const {p,s}=errNet('lampShort'); // 限改 2 次
  s.edits=[{op:'delWire',edge:'左导线'},{op:'delWire',edge:'右导线'}];
  s.selected='旁路线';
  A.action(s,'ac:editOp','delWire',p);
  assert(/上限/.test(s.editMsg),'超限应被拒绝');ok('改线次数上限生效');
  A.action(s,'ac:undoEdit',null,p);
  assert(s.edits.length===1);ok('撤销改线');
  A.action(s,'ac:resetEdit',null,p);
  assert(s.edits.length===0&&!s.showStd);ok('重置改错');
}
// ---------- 五、测量追踪 describeMeasure ----------
{
  const p=pages.find(p=>p.config==='seriesMeter')||pages[0];
  const s=A.initial(p);const net=A.make(p,s);const res=A.solve(net,net.switches||{});
  const vId=net.edges.find(e=>e.type==='voltmeter')?.id;
  const aId=net.edges.find(e=>e.type==='ammeter')?.id;
  if(vId){const d=A.describeMeasure(net,res,vId);assert(d&&d.kind==='V'&&d.plusLabel&&d.minusLabel,'电压表应给出正负端节点');ok('电压表正负端追踪 '+vId);}
  if(aId){const d=A.describeMeasure(net,res,aId);assert(d&&d.kind==='A','电流表应给出串联对象');ok('电流表路径追踪 '+aId);}
  // 反接感知：reverse 页 V₁ 应报反偏
  const {net:rn}=errNet('reverse');const rr=A.solve(rn,rn.switches||{});
  assert(rr.meter['V₁']<0,'反接时读数应为负');ok('电压表反接读数为负');
}
// ---------- 六、开路/短路边界一致性 ----------
{
  const p=pages.find(p=>p.config==='stateCompare');
  if(p){for(let i=0;i<5;i++){const s=A.initial(p);s.acCase=i;const net=A.make(p,s);const r=A.solve(net,net.switches||{});
    const sh=A.render(p,s,3);assert(sh.picture.includes('<svg')&&!sh.picture.includes('NaN'));
    if(i===4)assert(r.sourceShort,'电源短路应检出');else assert(!r.sourceShort);
    if(i===1)assert.strictEqual(r.total,0,'总开关断开无电流');
  }ok('通路/开路/短路五态一致');}
}
// ---------- 七、拓扑串联判定回归（P0 修复） ----------
// 反例：等阻并联，两支路电流相等，但 A错 只与 L1 同支路
{
  const net=A.parallel({count:2,branchMeters:true,res:[10,10]});
  net.edges.find(e=>e.id==='A1').id='A错';
  const res=A.solve(net,net.switches||{});
  near(res.current['A错'],0.6);near(res.current['L1'],0.6);near(res.current['L2'],0.6);
  // describeMeasure 不应把 L2 列为串联
  const dm=A.describeMeasure(net,res,'A错');
  assert(dm.series.includes('L1')&&!dm.series.includes('L2'),'等阻并联：A错只与L1串联');ok('等阻并联 describeMeasure 不误判');
  // checkEdit 不应判对
  assert(!A.checkEdit('ammeterParallel',net,res).ok,'等阻并联错接不应判对');ok('等阻并联 checkEdit 拒绝误判');
  assert(!A.checkEdit('multiFix',net,res).ok);ok('multiFix 等阻并联拒绝误判');
  // inSeriesTopo 直接验证
  assert(A.inSeriesTopo(net,'A错','L1'),'A错与L1拓扑串联');ok('inSeriesTopo 同支路为真');
  assert(!A.inSeriesTopo(net,'A错','L2'),'A错与L2非串联');ok('inSeriesTopo 并联为假');
}
// 对称零电流：断开开关，电流为零，保守判否
{
  const net=A.series({switchOpen:true});const res=A.solve(net,net.switches||{});
  assert(Math.abs(res.current['A₀']||0)<1e-9,'开关断开应无电流');
  assert(!A.inSeriesTopo(net,'A₀','L1'),'零电流时保守判否');ok('零电流保守判否');
  assert(A.seriesLoadsTopo(net,'A₀').length===0,'零电流时无测量对象');ok('零电流无测量对象');
}
// 反向电流：调换电流表端点，读数为负，但串联判定不变
{
  const net=A.series({});const a0=net.edges.find(e=>e.id==='A₀');
  const tmp=a0.a;a0.a=a0.b;a0.b=tmp; // 交换端点
  const res=A.solve(net,net.switches||{});
  assert(res.current['A₀']<0,'反接后端点电流为负');
  assert(A.inSeriesTopo(net,'A₀','L1'),'反向电流不改变串联判定');ok('反向电流串联判定不变');
}
// 干路/支路分辨：parallel2 中 A₀ 测干路，A1 只测 L1 支路
{
  const p0=pages[0],s0=A.initial(p0);const net=A.make(p0,s0);
  const dm0=A.describeMeasure(net,A.solve(net,net.switches||{}),'A₀');
  assert(dm0.series.includes('L1')&&dm0.series.includes('L2'),'干路表测到两支路');ok('干路表测量包含两支路');
  assert(!A.inSeriesTopo(net,'A₀','L1'),'干路表与支路非严格串联');ok('干路/支路严格串联区分');
  const dm1=A.describeMeasure(net,A.solve(net,net.switches||{}),'A1');
  assert(dm1.series.includes('L1')&&!dm1.series.includes('L2'),'支路表只测本支路');ok('支路表只测本支路');
}
// 真串联：series() 中 A₀ 与 L1、L2 均串联
{
  const net=A.series({});const res=A.solve(net,net.switches||{});
  assert(A.inSeriesTopo(net,'A₀','L1'),'干路表与L1串联');ok('真串联判定为真');
  assert(A.inSeriesTopo(net,'A₀','L2'),'干路表与L2串联');ok('干路表与多负载串联');
  const dm=A.describeMeasure(net,res,'A₀');
  assert(dm.series.includes('L1')&&dm.series.includes('L2'));ok('干路表串联对象完整');
}
console.log(`\n全部 ${n} 项交互测试通过`);
