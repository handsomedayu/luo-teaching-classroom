'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../physics/grade-9/electricity-03'),ctx={window:{LESSON:{pages:[]}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'advanced.js'),'utf8')+';window.AC=AdvancedCircuits;',ctx);
const A=ctx.window.AC,pages=ctx.window.LESSON.pages,near=(actual,expected)=>assert(Math.abs(actual-expected)<1e-8,`${actual} ≠ ${expected}`);
assert.strictEqual(pages.length,22);const page=c=>pages.find(p=>p.config===c);const model=(c,change={})=>{const p=page(c),s={...A.initial(p),...change};const net=A.make(p,s);return {net,result:A.solve(net,net.switches),p,s};};
{
 const {result}=model('parallel2');near(result.total,.9);near(result.meter['A₀'],.9);near(result.meter.A1,.6);near(result.meter.A2,.3);
}
{
 const {result}=model('voltage3');near(result.total,.1);near(result.meter['V₁'],1);near(result.meter['V₂'],5);near(result.meter['V₃'],6);
}
{
 const on=model('switchCombo'),local=model('switchCombo',{switches:{...A.initial(page('switchCombo')).switches,S3:true}}),danger=model('switchCombo',{switches:{...A.initial(page('switchCombo')).switches,S4:true}});
 near(on.result.total,1.05);near(local.result.total,1.5);near(local.result.current.L3,0);assert(danger.result.sourceShort);
}
{
 const r=model('seriesOpen').result;near(r.total,0);assert(!r.lit.L1);
 const f=model('faultSeries').result;near(f.meter['V₁'],0);near(f.meter['V₂'],6);near(f.meter['A₀'],0);
}
{
 const r=model('parallelOpen').result;near(r.total,.8);near(r.current.L1,.6);near(r.current.L2,0);near(r.current.L3,.2);
 const s=model('localShort').result;near(s.total,.6);near(s.current.L2,0);assert(s.lit.L1);
}
for(let i=0;i<5;i++){const r=model('stateCompare',{acCase:i}).result;assert.strictEqual(r.sourceShort,i===4);if(i===1||i===2)near(r.total,0);if(i===3)near(r.total,.6);}
for(const p of pages){const s=A.initial(p);for(let i=0;i<(p.cases?.length||1);i++){s.acCase=i;for(const fixed of [false,true]){s.fixed=fixed;const net=A.make(p,s),r=A.solve(net,net.switches),shown=A.render(p,s,3);assert(shown.picture.includes('<svg')&&!shown.picture.includes('NaN'));const expNet=p.task==='error'?A.applyEdits(A.make(p,{...s,fixed:false}),s.edits||[]):net;assert.strictEqual(A.solve(expNet,expNet.switches||{}).sourceShort,shown.data.sourceShort);}}}
{
 const p=page('oneMove'),bad=A.make(p,{...A.initial(p),fixed:false}),good=A.make(p,{...A.initial(p),fixed:true}),b=bad.edges.find(e=>e.id==='V₁'),g=good.edges.find(e=>e.id==='V₁');assert.notStrictEqual(b.a,g.a);assert.strictEqual(b.b,g.b);
 const p2=page('oneDelete'),n1=A.make(p2,{...A.initial(p2),fixed:false}),n2=A.make(p2,{...A.initial(p2),fixed:true});assert.strictEqual(n1.edges.filter(e=>e.id==='旁路线').length-n2.edges.filter(e=>e.id==='旁路线').length,1);
 const p3=page('multiFix'),m1=A.make(p3,{...A.initial(p3),fixed:false}),m2=A.make(p3,{...A.initial(p3),fixed:true}),a1=m1.edges.find(e=>e.id==='A错'),a2=m2.edges.find(e=>e.id==='A错');assert.notStrictEqual(a1.a,a2.a);assert.notStrictEqual(a1.b,a2.b);assert(A.solve(m1,m1.switches).sourceShort&&!A.solve(m2,m2.switches).sourceShort);
}
{
 const expected={ammeterParallel:[true,false],voltmeterSeries:[0,.2],reverse:[-2,2],range:[.6,3],switchPlace:[0,.3],rheostatWrong:[.001,10],seriesInstead:['series','parallel'],lampShort:[0,.2],sourceShort:[true,false],multiError:[0,.2]};
 for(const [name,[before,after]]of Object.entries(expected)){const p=pages.find(x=>x.cases?.includes(name)),i=p.cases.indexOf(name),bad=A.make(p,{...A.initial(p),acCase:i,fixed:false}),good=A.make(p,{...A.initial(p),acCase:i,fixed:true}),b=A.solve(bad,bad.switches),g=A.solve(good,good.switches);
  if(name==='ammeterParallel'||name==='sourceShort'){assert.strictEqual(b.sourceShort,before);assert.strictEqual(g.sourceShort,after);}
  else if(name==='voltmeterSeries'||name==='switchPlace'){near(b.total,before);near(g.total,after);}
  else if(name==='reverse'){near(b.meter['V₁'],before);near(g.meter['V₁'],after);}
  else if(name==='range'){near(bad.edges.find(e=>e.id==='A₀').range,before);near(good.edges.find(e=>e.id==='A₀').range,after);}
  else if(name==='rheostatWrong'){near(bad.edges.find(e=>e.id==='L2').r,before);near(good.edges.find(e=>e.id==='L2').r,after);}
  else if(name==='seriesInstead'){assert.strictEqual(bad.kind,before);assert.strictEqual(good.kind,after);}
  else if(name==='lampShort'||name==='multiError'){near(b.current.L2,before);near(g.current.L2,after);}
 }
}
console.log(`Advanced circuit model: ${pages.length} pages, topology, readings, fault and edit constraints passed`);
