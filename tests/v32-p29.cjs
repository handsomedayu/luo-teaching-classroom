'use strict';
const fs=require('fs'),path=require('path'),{chromium,webkit}=require('./browser.cjs');
const root=path.resolve(__dirname,'../physics/grade-9/electricity-03'),out=path.resolve(__dirname,'../test-results/v32-p29-clickwire'),resultDir=out;
const url='file:///'+root.replace(/\\/g,'/')+'/index.html',fail=[];let passed=0;
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(resultDir,{recursive:true});
const check=(ok,label,details='')=>{if(ok)passed++;else fail.push({label,details});},near=(x,y)=>Math.abs(x-y)<1e-6;
async function snap(p){return p.evaluate(()=>{const s=experiments[page],net=modelData.net,r=AdvancedCircuits.solve(net,net.switches||{}),v=net.edges.find(e=>e.id==='V₁'),l=net.edges.find(e=>e.id==='L2');return {edits:s.edits.map(e=>e.op),done:s.editDone,pending:s.p29Pending,selected:s.p29SelectedWire,sourceShort:r.sourceShort,meter:r.meter['V₁'],total:r.total,a:v.a,b:v.b,positive:v.positive,geometry:v.points[0],hasMeter:!!v,hasLeftWire:net.edges.some(e=>e.id==='左导线'),l2Voltage:Math.abs(r.voltage[r.roots[l.a]]-r.voltage[r.roots[l.b]])};});}
async function point(p,x,y){return p.evaluate(([x,y])=>{const svg=document.querySelector('.p29-terms').ownerSVGElement,q=svg.createSVGPoint();q.x=x;q.y=y;const r=q.matrixTransform(svg.getScreenCTM());return {x:r.x,y:r.y};},[x,y]);}
async function open(browser,width,height,touch=false){const ctx=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch});await ctx.route(/^https?:/,r=>r.abort());const p=await ctx.newPage();p.on('pageerror',e=>fail.push({label:'pageerror',details:e.message}));p.on('console',m=>{if(m.type()==='error')fail.push({label:'console',details:m.text()});});await p.goto(url);await p.evaluate(()=>goto(28));return {ctx,p};}
async function clickTerm(p,key,touch=false){const [x,y]=key.split(',').map(Number),pt=await point(p,x,y);if(touch)await p.touchscreen.tap(pt.x,pt.y);else await p.mouse.click(pt.x,pt.y);}
async function clickWire(p,x,y,button='left',touch=false){const pt=await point(p,x,y);if(touch)await p.touchscreen.tap(pt.x,pt.y);else await p.mouse.click(pt.x,pt.y,{button});}
async function desktop(browser,width,height){const {ctx,p}=await open(browser,width,height),tag=`Chrome-${width}`;
 const hints=(await p.locator('.edit-hint').allTextContents()).join(' '),start=await snap(p);
 check(!/V₁|正端|正极引线|左端|360,180/.test(hints),tag+' initial hides answer',hints);
 check(start.edits.length===0&&near(start.meter,6)&&near(start.total,.2)&&start.a==='A0'&&start.b==='Z',tag+' original graph and physics',start);
 check(await p.locator('[data-p29-term]').count()>=6&&await p.locator('[data-p29-wire]').count()>=4,tag+' visible terminals and wires');
 check(await p.locator('.p29-hit').first().getAttribute('r')==='30'&&await p.locator('.p29-wire-hit').first().getAttribute('stroke-width')==='40',tag+' large transparent hit areas');
 check(await p.locator('[data-value="moveA"],[data-value="moveB"],.p29-preview').count()===0,tag+' no drag/menu controls');
 check(await p.evaluate(()=>{const e=document.querySelector('[data-component="L1"]'),v=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});return !e.dispatchEvent(v);}),tag+' browser context menu suppressed in circuit');
 if(width===1366)await p.screenshot({path:path.join(out,'29-initial-1366.png')});
 await clickWire(p,255,180,'right');check((await snap(p)).edits.length===0,tag+' right-click lamp cannot delete');
 await clickWire(p,520,95,'right');check((await snap(p)).edits.length===0&&(await snap(p)).hasMeter,tag+' right-click voltmeter cannot delete');
 await clickWire(p,100,260,'right');check((await snap(p)).edits.join()==='delWire'&&!(await snap(p)).hasLeftWire,tag+' right-click ordinary wire removes actual edge');
 await p.locator('[data-action="ac:check"]').click();check(!(await snap(p)).done,tag+' deleting wrong wire fails answer check');
 await p.keyboard.press('Control+z');check((await snap(p)).edits.length===0&&(await snap(p)).hasLeftWire,tag+' undo restores ordinary wire');
 await clickWire(p,650,130,'right');check((await snap(p)).edits.length===0,tag+' correct lead protected');
 await clickWire(p,155,128,'right');let x=await snap(p);
 check(x.edits.join()==='detachLead'&&x.a==='V1_FREE'&&x.b==='Z'&&x.positive==='V1_FREE'&&x.hasMeter&&x.geometry[1]===145,tag+' right-click disconnects only wrong lead',x);
 check(await p.locator('[data-p29-term="155,145"]').count()===1,tag+' free terminal matches topology');
 if(width===1366)await p.screenshot({path:path.join(out,'29-disconnected-1366.png')});
 await p.locator('[data-action="ac:check"]').click();check(!(await snap(p)).done&&/还要/.test(await p.locator('.edit-msg').textContent()),tag+' incomplete line fails check');
 await clickTerm(p,'155,145');await clickTerm(p,'360,180');x=await snap(p);
 check(x.edits.join()==='moveEnd'&&x.a==='n1'&&x.b==='Z'&&x.positive==='n1'&&x.geometry[0]===360&&near(x.meter,4)&&near(x.total,.2)&&near(x.l2Voltage,4)&&!x.sourceShort,tag+' delete then reconnect is one physical edit',x);
 await p.locator('[data-action="ac:check"]').click();check((await snap(p)).done,tag+' actual answer validation');
 await p.locator('[data-action="ac:p29compare"]').click();check(await p.locator('.ac-compare svg').count()===2&&(await p.locator('.ac-compare').textContent()).includes('当前（真实改线）'),tag+' comparison uses student graph');
 if(width===1920)await p.screenshot({path:path.join(out,'29-after-reconnect-1920.png')});
 await p.keyboard.press('Control+z');x=await snap(p);check(x.edits.length===0&&x.a==='A0'&&x.b==='Z'&&near(x.meter,6),tag+' Ctrl+Z restores model and picture',x);
 await clickTerm(p,'155,180');await clickTerm(p,'100,180');x=await snap(p);check(x.edits.join()==='moveEnd'&&x.a==='A'&&x.b==='Z'&&near(x.meter,6),tag+' wrong connection is recorded and undoable',x);
 await p.locator('[data-action="ac:check"]').click();check(!(await snap(p)).done,tag+' wrong graph fails answer check');
 await p.locator('[data-action="ac:undoEdit"]').click();check((await snap(p)).edits.length===0,tag+' undo button restores wrong connection');
 await clickTerm(p,'155,180');await clickTerm(p,'360,180');check((await snap(p)).edits.join()==='moveEnd'&&near((await snap(p)).meter,4),tag+' two-left-click connection works without delete');
 await p.locator('[data-action="ac:resetEdit"]').click();check((await snap(p)).edits.length===0&&near((await snap(p)).meter,6),tag+' reset restores original');
 await clickWire(p,155,128,'right');await clickTerm(p,'155,145');await clickTerm(p,'100,180');x=await snap(p);check(x.edits.join()==='moveEnd'&&x.a==='A'&&x.b==='Z',tag+' wrong reconnect after deletion changes actual graph');
 await p.keyboard.press('Control+z');check((await snap(p)).edits.length===0&&near((await snap(p)).meter,6),tag+' Ctrl+Z undoes wrong reconnect');
 const bounds=await p.evaluate(()=>{const c=document.querySelector('#content').getBoundingClientRect(),v=document.querySelector('#visual-picture').getBoundingClientRect();return {fits:v.right<=c.right+3&&v.bottom<=c.bottom+3,scroll:document.documentElement.scrollWidth-innerWidth};});check(bounds.fits&&bounds.scroll<=3,tag+' layout',bounds);
 await p.locator('#fullscreen').click();check(await p.evaluate(()=>!!document.fullscreenElement),tag+' fullscreen');if(await p.evaluate(()=>!!document.fullscreenElement))await p.locator('#fullscreen').click();
 await p.locator('#prev').click();check((await p.locator('#page-count').textContent()).startsWith('28 /'),tag+' previous page');await p.locator('#next').click();check((await p.locator('#page-count').textContent()).startsWith('29 /'),tag+' next page');
 await ctx.close();
}
async function mobile(browser,name){const {ctx,p}=await open(browser,844,390,true),tag=name+'-touch';
 await clickWire(p,155,128,'left',true);check(await p.locator('[data-action="ac:p29delete"]').count()===1,tag+' touch selects wire and exposes delete');
 await p.locator('[data-action="ac:p29delete"]').click();check((await snap(p)).a==='V1_FREE'&&(await snap(p)).b==='Z',tag+' touch deletes only wrong lead');
 await clickTerm(p,'155,145',true);await clickTerm(p,'360,180',true);check(near((await snap(p)).meter,4)&&(await snap(p)).edits.join()==='moveEnd',tag+' touch two-tap reconnect');
 await p.locator('[data-action="ac:check"]').click();check((await snap(p)).done,tag+' touch answer validation');
 if(name==='Chrome')await p.screenshot({path:path.join(out,'29-touch-landscape.png')});
 await p.locator('[data-action="ac:resetEdit"]').click();check(near((await snap(p)).meter,6),tag+' touch reset');await ctx.close();
}
(async()=>{const chrome=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{await desktop(chrome,1920,1080);await desktop(chrome,1366,768);await mobile(chrome,'Chrome');}finally{await chrome.close();}
 try{const wk=await webkit.launch({headless:true});try{await mobile(wk,'WebKit');}finally{await wk.close();}}catch(e){fail.push({label:'WebKit',details:e.message});}
 const result={passed,failed:fail.length,fail};fs.writeFileSync(path.join(resultDir,'results.json'),JSON.stringify(result,null,2));console.log(result);if(fail.length)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
