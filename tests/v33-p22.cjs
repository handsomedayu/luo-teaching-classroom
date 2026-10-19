'use strict';
const fs=require('fs'),path=require('path'),{chromium,webkit}=require('./browser.cjs');
const root=path.resolve(__dirname,'../physics/grade-9/electricity-03'),out=path.resolve(__dirname,'../test-results/v33-p22');
fs.mkdirSync(out,{recursive:true});const url='file:///'+root.replace(/\\/g,'/')+'/index.html',fail=[];let passed=0;
const check=(ok,label)=>{if(ok)passed++;else fail.push(label);},near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-6;
async function run(browser,name,viewport,touch=false){
 const ctx=await browser.newContext({viewport,isMobile:touch,hasTouch:touch}),p=await ctx.newPage();await ctx.route(/^https?:/,r=>r.abort());
 p.on('pageerror',e=>fail.push(name+' JS '+e.message));p.on('console',m=>{if(m.type()==='error')fail.push(name+' console '+m.text());});await p.goto(url);await p.evaluate(()=>goto(21));
 const data=()=>p.evaluate(()=>({total:modelData.total,lit:modelData.lit,short:modelData.sourceShort,readings:modelData.readings,correct:modelData.correct,wires:experiments[page].p23Wires.map(w=>({...w})),caption:document.querySelector('#caption').textContent}));
 const connect=async(a,b)=>{await p.locator(`[data-action="ac:p23Term"][data-value="${a}"]`).click();await p.locator(`[data-action="ac:p23Term"][data-value="${b}"]`).click();};
 const hit=async(id,button='right')=>{const pos=await p.locator(`.p23-pane:nth-child(2) .p23-wire[data-p23-wire="${id}"] .p23-wire-hit`).evaluate(e=>{const s=e.ownerSVGElement,z=s.createSVGPoint(),pt=e.getPointAtLength(e.getTotalLength()/2);z.x=pt.x;z.y=pt.y;const q=z.matrixTransform(s.getScreenCTM());return {x:q.x,y:q.y};});if(touch)await p.touchscreen.tap(pos.x,pos.y);else await p.mouse.click(pos.x,pos.y,{button});};
 let x=await data();check(x.wires.length===0&&near(x.total,0)&&!x.correct,name+' blank student circuit');
 check(await p.locator('.p23-pane:first-child svg').count()===1&&await p.locator('.p23-pane:nth-child(2) .p23-wire').count()===0,name+' question visible and answer hidden');
 check(!(await p.locator('#readings').textContent()).trim(),name+' no preset readings');await p.screenshot({path:path.join(out,`initial-${name}.png`)});
 await connect('P','N');x=await data();check(x.wires.length===0&&/危险/.test(x.caption),name+' source short blocked');
 for(const [a,b]of [['P','A0P'],['A0N','B'],['B','A1P'],['A1N','L1A'],['L1B','R'],['R','N']])await connect(a,b);
 x=await data();check(near(x.total,.6)&&x.lit.L1&&!x.lit.L2&&!x.correct,name+' one parallel branch only 0.60 A');
 check(near(x.readings.A0,.6)&&near(x.readings.A1,.6)&&x.readings.A2===null,name+' readings use current student branch');
 for(const [a,b]of [['B','A2P'],['A2N','L2A'],['L2B','R']])await connect(a,b);
 x=await data();check(x.wires.length===9&&near(x.total,.9)&&x.lit.L1&&x.lit.L2&&x.correct,name+' both branches actual 0.90 A');
 check(near(x.readings.A0,.9)&&near(x.readings.A1,.6)&&near(x.readings.A2,.3),name+' KCL 0.90 = 0.60 + 0.30');
 check(await p.locator('.p23-pane:nth-child(2) .p23-wire').count()===x.wires.length,name+' visible wire count matches model');
 await p.locator('[data-action="ac:p23Check"]').click();check(/接线正确/.test((await data()).caption),name+' check accepts real topology');await p.screenshot({path:path.join(out,`correct-${name}.png`)});
 const w=x.wires.find(w=>w.a==='L2B'&&w.b==='R');await hit(w.id,touch?'left':'right');if(touch){check(await p.locator('.p23-pane:nth-child(2) .p23-wire.is-selected').count()===1,name+' touch selects line');await p.locator('[data-action="ac:p23Delete"]').click();}
 x=await data();check(x.wires.length===8&&near(x.total,.6)&&!x.lit.L2&&!x.correct,name+' deleting L2 return opens only L2 branch');
 await p.keyboard.press('Control+z');x=await data();check(x.wires.length===9&&near(x.total,.9)&&x.correct,name+' undo restores branch');
 await p.locator('.p23-bulb').first().click({button:'right'});check((await data()).wires.length===9,name+' right click component cannot delete');
 await p.locator('[data-action="ac:p23Reset"]').click();x=await data();check(x.wires.length===0&&near(x.total,0),name+' reset blank');
 await connect('P','L1A');x=await data();check(x.wires.length===1&&!x.correct,name+' safe wrong wire retained');
 await p.locator('[data-action="ac:p23Answer"]').click();check(await p.locator('.p23-pane:nth-child(2) .p23-wire.is-answer').count()===9,name+' teacher answer only on request');
 await p.locator('[data-action="ac:p23Answer"]').click();check(await p.locator('.p23-pane:nth-child(2) .p23-wire.is-answer').count()===0,name+' return to student lines');
 await p.locator('[data-action="ac:p23Reset"]').click();
 for(const [a,b]of [['P','A0P'],['A0N','A1P'],['A1P','A2P'],['A1N','L1A'],['A2N','L2A'],['L1B','N'],['L2B','N']])await connect(a,b);
 x=await data();check(x.correct&&near(x.total,.9)&&near(x.readings.A0,.9),name+' equivalent direct junction wiring accepted');
 const layout=await p.evaluate(()=>{const m=document.querySelector('#content').getBoundingClientRect(),v=document.querySelector('.visual').getBoundingClientRect(),b=document.querySelector('.p23-board').getBoundingClientRect();return v.bottom<=m.bottom+2&&b.right<=m.right+2&&document.documentElement.scrollWidth<=innerWidth;});check(layout,name+' viewport layout');await ctx.close();
}
(async()=>{const chrome=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{await run(chrome,'chrome-1920',{width:1920,height:1080});await run(chrome,'chrome-1366',{width:1366,height:768});}finally{await chrome.close();}const wk=await webkit.launch({headless:true});try{await run(wk,'webkit-touch-844',{width:844,height:390},true);}finally{await wk.close();}const report={passed,failed:fail.length,fail};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(report);if(fail.length)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1;});
