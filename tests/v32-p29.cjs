'use strict';
const fs=require('fs'),path=require('path'),{chromium,webkit}=require('./browser.cjs');
const root=path.resolve(__dirname,'../physics/grade-9/electricity-03'),out=path.resolve(__dirname,'../reports/v32-p29'),resultDir=path.resolve(__dirname,'../test-results/v32-p29');
const url='file:///'+root.replace(/\\/g,'/')+'/index.html',fail=[];let passed=0;
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(resultDir,{recursive:true});
const check=(ok,label,details='')=>{if(ok)passed++;else fail.push({label,details});};
const near=(x,y)=>Math.abs(x-y)<1e-6;
async function center(page,selector){const r=await page.locator(selector).first().boundingBox();if(!r)throw Error('No hit box: '+selector);return {x:r.x+r.width/2,y:r.y+r.height/2};}
async function snap(page){return page.evaluate(()=>{const s=experiments[page],net=modelData.net,r=AdvancedCircuits.solve(net,net.switches||{}),v=net.edges.find(e=>e.id==='V₁'),l=net.edges.find(e=>e.id==='L2');return {edits:s.edits.length,done:s.editDone,sourceShort:r.sourceShort,meter:r.meter['V₁'],total:r.total,positive:v.positive,voltageStart:v.a,geometry:v.points[0],l2Voltage:Math.abs(r.voltage[r.roots[l.a]]-r.voltage[r.roots[l.b]])};});}
async function open(browser,size,mobile=false){const ctx=await browser.newContext({viewport:{width:size[0],height:size[1]},isMobile:mobile,hasTouch:mobile});await ctx.route(/^https?:/,r=>r.abort());const p=await ctx.newPage();p.on('pageerror',e=>fail.push({label:'pageerror',details:e.message}));p.on('console',m=>{if(m.type()==='error')fail.push({label:'console',details:m.text()});});await p.goto(url);await p.evaluate(()=>goto(28));return {ctx,p};}
async function desktop(browser,width,height){const {ctx,p}=await open(browser,[width,height]),tag=`desktop-${width}`;
 const hints=(await p.locator('.edit-hint').allTextContents()).join(' ');
 check(!/V₁|正端|正极引线|左端|360,180/.test(hints),tag+' initial gives no endpoint answer',hints);
 check(await p.locator('[data-p29-origin]').count()>=4&&await p.locator('[data-p29-target]').count()>=4,tag+' endpoint hit areas');
 const start=await snap(p);check(start.edits===0&&near(start.meter,6)&&near(start.total,.2),tag+' original physics',start);
 check(await p.locator('[data-value="moveA"],[data-value="moveB"]').count()===0,tag+' no layered menu');
 if(width===1366)await p.screenshot({path:path.join(out,'29-initial-1366.png')});
 await p.locator('[data-p29-origin="V₁"][data-p29-end="b"]').click();await p.locator('[data-p29-target="360,180"]').click();
 check((await snap(p)).edits===0&&/未改变/.test(await p.locator('.edit-msg').textContent()),tag+' wrong endpoint rejected');
 await p.locator('[data-p29-origin="V₁"][data-p29-end="a"]').click();await p.locator('[data-p29-target="100,180"]').click();
 check((await snap(p)).edits===0,tag+' wrong target leaves topology unchanged');
 const origin=await center(p,'[data-p29-origin="V₁"][data-p29-end="a"]');
 await p.mouse.move(origin.x,origin.y);await p.mouse.down();await p.mouse.move(origin.x+68,origin.y-26,{steps:8});
 check(await p.locator('.p29-preview.is-visible').count()===1,tag+' live wire preview');
 if(width===1366)await p.screenshot({path:path.join(out,'29-drag-preview-1366.png')});
 await p.mouse.up();check((await snap(p)).edits===0,tag+' empty drop leaves topology unchanged');
 await p.locator('[data-action="ac:p29hint"]').click();check((await p.locator('.edit-hint').allTextContents()).join(' ').includes('先沿导线'),tag+' layered hint on demand');
 await p.locator('[data-p29-origin="V₁"][data-p29-end="a"]').click();await p.locator('[data-p29-target="360,180"]').click();
 const after=await snap(p);check(after.edits===1&&near(after.meter,4)&&near(after.l2Voltage,4)&&near(after.total,.2)&&after.positive==='n1'&&after.voltageStart==='n1'&&after.geometry[0]===360&&!after.sourceShort,tag+' click changes graph geometry and calculated reading',after);
 check((await p.locator('#readings').textContent()).includes('6.00 V')&&(await p.locator('#readings').textContent()).includes('4.00 V'),tag+' before/current readout');
 await p.locator('[data-p29-origin="V₁"][data-p29-end="b"]').click();await p.locator('[data-p29-target="155,180"]').click();check((await snap(p)).edits===1,tag+' one-change limit');
 await p.locator('[data-action="ac:check"]').click();check((await snap(p)).done,tag+' actual answer check');
 await p.locator('[data-action="ac:p29compare"]').click();check(await p.locator('.ac-compare svg').count()===2&&(await p.locator('.ac-compare').textContent()).includes('当前（真实改线）'),tag+' before/current real circuit comparison');
 if(width===1366)await p.screenshot({path:path.join(out,'29-before-current-1366.png')});
 await p.locator('[data-action="ac:undoEdit"]').click();const undone=await snap(p);check(undone.edits===0&&near(undone.meter,6)&&undone.geometry[0]===155,tag+' undo restores graph and meter',undone);
 await p.locator('[data-p29-origin="V₁"][data-p29-end="a"]').click();await p.locator('[data-p29-target="360,180"]').click();await p.locator('[data-action="ac:resetEdit"]').click();check((await snap(p)).edits===0&&near((await snap(p)).meter,6),tag+' reset restores original');
 const a=await center(p,'[data-p29-origin="V₁"][data-p29-end="a"]'),t=await center(p,'[data-p29-target="360,180"]');await p.mouse.move(a.x,a.y);await p.mouse.down();await p.mouse.move(t.x,t.y,{steps:12});await p.mouse.up();
 check((await snap(p)).edits===1&&near((await snap(p)).meter,4),tag+' mouse drag accepted');
 if(width===1920)await p.screenshot({path:path.join(out,'29-after-drag-1920.png')});
 const bounds=await p.evaluate(()=>{const c=document.querySelector('#content').getBoundingClientRect(),v=document.querySelector('#visual-picture').getBoundingClientRect();return {fits:v.right<=c.right+3&&v.bottom<=c.bottom+3,scroll:document.documentElement.scrollWidth-innerWidth};});check(bounds.fits&&bounds.scroll<=3,tag+' layout',bounds);
 await p.locator('#reset').click();check((await snap(p)).edits===0&&near((await snap(p)).meter,6),tag+' classroom replay resets sample');
 await p.locator('#fullscreen').click();check(await p.evaluate(()=>!!document.fullscreenElement),tag+' fullscreen');if(await p.evaluate(()=>!!document.fullscreenElement))await p.locator('#fullscreen').click();
 await p.locator('#prev').click();check((await p.locator('#page-count').textContent()).startsWith('28 /'),tag+' previous page');await p.locator('#next').click();check((await p.locator('#page-count').textContent()).startsWith('29 /'),tag+' next page');
 await ctx.close();
}
async function touch(browser,name,drag=false){const {ctx,p}=await open(browser,[844,390],true),tag=name+'-touch';
 const tap=async selector=>{const pt=await center(p,selector);await p.touchscreen.tap(pt.x,pt.y);};
 await tap('[data-p29-origin="V₁"][data-p29-end="a"]');await tap('[data-p29-target="360,180"]');check((await snap(p)).edits===1&&near((await snap(p)).meter,4),tag+' two-tap connection');
 await p.locator('[data-action="ac:undoEdit"]').click();check((await snap(p)).edits===0,tag+' touch undo');
 if(drag){const a=await center(p,'[data-p29-origin="V₁"][data-p29-end="a"]'),t=await center(p,'[data-p29-target="360,180"]'),cdp=await ctx.newCDPSession(p);
   const stroke=async end=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+(end.x-a.x)*i/12,y:a.y+(end.y-a.y)*i/12}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
   await stroke({x:a.x+80,y:a.y-30});check((await snap(p)).edits===0,tag+' empty touch drop leaves topology unchanged');
   await stroke(t);
   check((await snap(p)).edits===1&&near((await snap(p)).meter,4),tag+' actual touch drag');
   await p.screenshot({path:path.join(out,'29-touch-landscape.png')});
 }
 await ctx.close();
}
(async()=>{const chrome=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{await desktop(chrome,1920,1080);await desktop(chrome,1366,768);await touch(chrome,'Chrome',true);}finally{await chrome.close();}
 try{const wk=await webkit.launch({headless:true});try{await touch(wk,'WebKit');}finally{await wk.close();}}catch(e){fail.push({label:'WebKit launch or touch',details:e.message});}
 const result={passed,failed:fail.length,fail};fs.writeFileSync(path.join(resultDir,'results.json'),JSON.stringify(result,null,2));console.log(result);if(fail.length)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
