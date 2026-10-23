'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('./browser.cjs');
const out=path.resolve(__dirname,'../test-results/ch3-final');fs.mkdirSync(out,{recursive:true});
const results=[];
async function run(browser,name,viewport,touch=false){
 const ctx=await browser.newContext({viewport,hasTouch:touch,isMobile:touch});
 await ctx.route(/^https?:/,r=>r.abort());
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file:///'+path.resolve(__dirname,'../physics/grade-9/electricity-03/index.html').replace(/\\/g,'/'));
 // Navigation only; all experimental changes below use visible controls.
 await p.evaluate(()=>goto(22));
 const hit=async(action,value)=>{const l=p.locator(`[data-action="ac:${action}"]${value===undefined?'':`[data-value="${value}"]`}`);await(touch?l.tap():l.click());};
 const state=()=>p.evaluate(()=>({s:experiments[page],m:modelData,caption:document.querySelector('#caption').textContent}));
 const wire=async(a,b)=>{await hit('p23Term',a);await hit('p23Term',b);};
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
 await hit('p23Reset');await hit('p23Term','P');
 if(touch)await hit('p23Term','P');else await p.locator('[data-action="ac:p23Term"][data-value="P"]').click({button:'right'});
 assert.equal((await state()).s.p23Pending,null);
 await hit('p23Term','AP');assert.equal((await state()).s.p23Wires.length,0);
 if(!touch){await p.locator('.p23-pane:nth-child(2) svg').click({button:'right',position:{x:12,y:12}});assert.equal((await state()).s.p23Pending,null);}
 await hit('p23Reset');
 for(const [a,b] of [['P','AP'],['AN','L1A'],['L1B','L2A'],['L2B','N'],['L1A','V1P'],['L1B','V1N'],['L2A','V2P'],['L2B','V2N']])await wire(a,b);
 await hit('p23Check');let d=await state();assert.ok(d.m.correct);near(d.m.readings.A,.2);near(d.m.readings.V1,2);near(d.m.readings.V2,4);
 await wire('L1A','L1B');await hit('p23Check');d=await state();assert.ok(!d.m.correct);assert.match(d.s.p23Msg,/L₁.*局部短路.*L₂.*电源电压/);near(d.m.readings.A,.3);near(d.m.readings.V1,0);near(d.m.readings.V2,6);
 await p.screenshot({path:path.join(out,`F4-${name}.png`),fullPage:true});
 await hit('p23Undo');assert.ok((await state()).m.correct);
 await wire('P','N');assert.match((await state()).s.p23Msg,/危险/);assert.equal((await state()).s.p23Wires.length,8);
 await hit('p23Reset');assert.equal((await state()).s.p23Wires.length,0);
 await p.evaluate(()=>goto(26));await hit('check');assert.ok(!(await state()).s.editDone);
 const move=async(edge,end,node)=>{await hit('v33Start',`${edge}|${end}`);const key=await p.evaluate(node=>AdvancedCircuits.terminals(modelData.net,false).find(t=>t.node===node)?.key||AdvancedCircuits.terminals(AdvancedCircuits.make(lessons[page],{...experiments[page],fixed:false}),false).find(t=>t.node===node)?.key,node);assert.ok(key);await hit('v33Term',key);};
 for(let repeat=0;repeat<2;repeat++){
  await hit('resetEdit');await move('S1','a','P');await move('S1','b','M');await move('S₀','a','b1a');await move('S₀','b','b1b');await hit('check');d=await state();assert.ok(d.s.editDone);assert.ok(!d.m.lit.L1&&d.m.lit.L2);near(d.m.total,.3);
  await hit('v33Switch');d=await state();assert.ok(d.m.lit.L1&&d.m.lit.L2);near(d.m.total,.9);near(await p.evaluate(()=>AdvancedCircuits.solve(modelData.net,modelData.net.switches).meter['A₀']),.9);
 }
 await p.screenshot({path:path.join(out,`F1-${name}.png`),fullPage:true});
 await hit('undoEdit');assert.equal((await state()).s.edits.length,3);await hit('resetEdit');assert.equal((await state()).s.edits.length,0);
 await move('S₀','a','b1a');await move('S₀','b','b1b');await hit('check');assert.ok(!(await state()).s.editDone);near((await state()).m.total,0);
 await hit('resetEdit');await move('S1','a','P');await move('S1','b','N');d=await state();assert.equal(d.s.edits.length,1);assert.match(d.s.editMsg,/短路/);assert.ok(!d.m.sourceShort);
 await p.locator('[data-var="acCase"]').selectOption('1');await hit('resetEdit');
 const pair=async(a,b)=>{await hit('v33Rheo',a);await hit('v33Rheo',b);};
 for(const [a,b] of [['A','C'],['A','D'],['B','C']])await pair(a,b);
 assert.equal((await state()).s.edits.length,3);await pair('B','D');d=await state();assert.equal(d.s.edits.length,3);assert.equal(d.m.net.edges.find(e=>e.id==='L2').terminal,'BC');assert.match(d.s.editMsg,/次数/);
 await p.screenshot({path:path.join(out,`F3-${name}.png`),fullPage:true});
 await hit('undoEdit');await pair('B','D');assert.equal((await state()).s.edits.length,3);await hit('check');assert.ok((await state()).s.editDone);
 await hit('resetEdit');await pair('A','C');await pair('A','C');assert.equal((await state()).s.edits.length,1);
 assert.deepEqual(errors,[]);results.push({name,viewport,touch,browser:browser.version(),status:'PASS'});await ctx.close();
}
(async()=>{const b=await chromium.launch({channel:process.env.TEST_BROWSER||'chrome',headless:true});try{await run(b,'1920',{width:1920,height:1080});await run(b,'1366',{width:1366,height:768});await run(b,'touch',{width:844,height:390},true);}finally{await b.close();}})().catch(e=>{results.push({status:'FAIL',error:e.stack});process.exitCode=1;}).finally(()=>{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(results);});
