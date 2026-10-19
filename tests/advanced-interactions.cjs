'use strict';
const fs=require('fs'),path=require('path'),{chromium,webkit}=require('./browser.cjs');const root=path.resolve(__dirname,'../physics/grade-9/electricity-03'),out=path.resolve(__dirname,'../test-results/advanced-circuits');fs.mkdirSync(out,{recursive:true});const url='file:///'+root.replace(/\\/g,'/')+'/index.html',failed=[];let passed=0;function check(x,msg){if(x)passed++;else failed.push(msg);}
async function run(browser,name,viewport,mobile=false){const c=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});await c.route(/^https?:/,r=>r.abort());const p=await c.newPage();p.on('pageerror',e=>failed.push(name+' '+e.message));await p.goto(url);await p.waitForFunction(()=>typeof q==='function'&&lessons.length===34);
 for(const i of [20,21,23,24]){await p.evaluate(i=>goto(i),i);
  if([20,21,23,24].includes(i)){
   const terms=await p.locator('[data-action="ac:p23Term"]').count();check(terms===(i===20?6:i===21?14:i===23?10:24),name+' wiring terminals '+i);
   await p.locator('[data-action="ac:p23Term"][data-value="P"]').click();await p.locator(`[data-action="ac:p23Term"][data-value="${i===20?'L1A':i===21?'A0P':i===23?'AP':'S0P'}"]`).click();
   const partial=await p.evaluate(()=>({wires:experiments[page].p23Wires.length,total:modelData.total}));check(partial.wires===1&&Math.abs(partial.total||0)<1e-8,name+' actual partial wire '+i+' '+JSON.stringify(partial));
   await p.locator('[data-action="ac:p23Undo"]').click();check(await p.evaluate(()=>experiments[page].p23Wires.length===0),name+' wire undo '+i);
  }else{await p.locator('[data-action="ac:showRef"]').click();
   const terms=await p.locator('[data-action="ac:term"]').count();check(terms>0,name+' wiring terminals '+i);
   if(terms>=2){const pair=await p.evaluate(()=>{const net=AdvancedCircuits.make(lessons[page],experiments[page]),tm=AdvancedCircuits.terminals(net,true),w=AdvancedCircuits.requiredWires(net,true)[0];return [tm.find(t=>t.node===w.n1).key,tm.find(t=>t.node===w.n2).key];});
    await p.locator(`[data-action="ac:term"][data-value="${pair[0]}"]`).first().click();await p.locator(`[data-action="ac:term"][data-value="${pair[1]}"]`).first().click();
    const uw=await p.evaluate(()=>experiments[page].userWires.length);check(uw===1,name+' student wire placed '+i);}
   await p.locator('[data-action="ac:wireUndo"]').click();check(await p.evaluate(()=>experiments[page].userWires.length===0),name+' wire undo '+i);}
  // 教师演示模式
  await p.locator('[data-action="ac:wireMode"]').click();check(await p.evaluate(()=>experiments[page].wireMode==='demo'),name+' demo mode '+i);
  await p.locator('[data-action="ac:source"]').click();check(await p.evaluate(()=>experiments[page].showTarget),name+' conversion toggle '+i);
  await p.locator('[data-action="ac:wire"]').click();check(await p.evaluate(()=>modelData.visibleCount===1),name+' conversion first wire '+i);
  const total=await p.evaluate(()=>modelData.net.edges.length);for(let j=1;j<total;j++)await p.locator('[data-action="ac:wire"]').click();
  check(await p.evaluate(()=>modelData.visibleCount===modelData.net.edges.length),name+' conversion all wires '+i);
  if(name==='chrome')await p.screenshot({path:path.join(out,`conversion-${i+1}.png`)});await p.locator('#reset').click();}
 for(const i of [25,26,27,28,29,30]){await p.evaluate(i=>goto(i),i);const cases=await p.locator('#experiment-controls select').locator('option').count();for(let k=0;k<cases;k++){await p.locator('#experiment-controls select').selectOption(String(k));check(await p.evaluate(()=>(experiments[page].edits||[]).length===0),name+' fresh case '+i+'-'+k);
  if(i===25){
   if(k<2){await p.locator('[data-action="ac:v33Start"]').first().click();check(await p.evaluate(()=>!!experiments[page].v33Pending),name+' lead selected '+i+'-'+k);const key=await p.evaluate(node=>AdvancedCircuits.terminals(modelData.net,false).find(t=>t.node===node).key,k===0?'b2b':'A0');await p.locator(`[data-action="ac:v33Term"][data-value="${key}"]`).click();check(await p.evaluate(()=>experiments[page].edits.length===1),name+' lead moved '+i+'-'+k);}
   else{await p.locator('[data-v33-meter]').click();await p.locator(`[data-action="ac:${k===2?'v33Swap':'v33Range'}"]`).click();check(await p.evaluate(()=>experiments[page].edits.length===1),name+' meter corrected '+i+'-'+k);}
   await p.locator('[data-action="ac:check"]').click();check(await p.evaluate(()=>typeof experiments[page].editMsg==='string'&&experiments[page].editMsg.length>0),name+' check feedback '+i+'-'+k);
   await p.locator('[data-action="ac:undoEdit"]').click();check(await p.evaluate(()=>experiments[page].edits.length===0),name+' undo edit '+i+'-'+k);
   await p.locator('[data-action="ac:stdShow"]').click();check(await p.locator('.ac-compare svg').count()===2,name+' before-after '+i+'-'+k);
   await p.locator('#reset').click();continue;
  }
  if(i===26){
   if(k===1){await p.locator('[data-action="ac:v33Rheo"][data-value="A"]').click();await p.locator('[data-action="ac:v33Rheo"][data-value="C"]').click();}
   else{await p.locator(`[data-action="ac:v33Start"][data-value="${k===0?'S₀|a':'L2|a'}"]`).click();const key=await p.evaluate(node=>AdvancedCircuits.terminals(modelData.net,false).find(t=>t.node===node).key,k===0?'b1a':'A');await p.locator(`[data-action="ac:v33Term"][data-value="${key}"]`).click();}
   check(await p.evaluate(()=>experiments[page].edits.length===1),name+' direct change '+i+'-'+k);
   await p.locator('[data-action="ac:check"]').click();check(await p.evaluate(()=>experiments[page].editMsg.length>0),name+' check feedback '+i+'-'+k);
   await p.locator('[data-action="ac:undoEdit"]').click();check(await p.evaluate(()=>experiments[page].edits.length===0),name+' undo edit '+i+'-'+k);
   await p.locator('[data-action="ac:stdShow"]').click();check(await p.locator('.ac-compare svg').count()===2,name+' before-after '+i+'-'+k);
   await p.locator('#reset').click();continue;
  }
  if(i===27){
   const id=k===1?'危险短接':'旁路线',pt=await p.locator(`[data-v33-delete="${id}"] .p28-wire-hit`).evaluate(e=>{const svg=e.ownerSVGElement,z=svg.createSVGPoint(),p=e.getPointAtLength(e.getTotalLength()*.48);z.x=p.x;z.y=p.y;const r=z.matrixTransform(svg.getScreenCTM());return{x:r.x,y:r.y};});
   if(mobile){await p.touchscreen.tap(pt.x,pt.y);await p.locator('[data-action="ac:v33WireDelete"]').click();}else await p.mouse.click(pt.x,pt.y,{button:'right'});
   check(await p.evaluate(()=>experiments[page].edits.length===1),name+' wire deleted '+i+'-'+k);
   if(k===2){await p.locator('[data-v33-meter="V₁"]').click();await p.locator('[data-action="ac:v33Swap"]').click();}
   await p.locator('[data-action="ac:check"]').click();check(await p.evaluate(()=>experiments[page].editDone),name+' direct short correction '+i+'-'+k);
   await p.locator('[data-action="ac:undoEdit"]').click();if(k===2)await p.locator('[data-action="ac:undoEdit"]').click();check(await p.evaluate(()=>experiments[page].edits.length===0),name+' undo edit '+i+'-'+k);
   await p.locator('[data-action="ac:stdShow"]').click();check(await p.locator('.ac-compare svg').count()===2,name+' before-after '+i+'-'+k);
   await p.locator('#reset').click();continue;
  }
  if(i===29){
   const pt=await p.locator('[data-v33-delete="旁路线"] .p28-wire-hit').evaluate(e=>{const svg=e.ownerSVGElement,z=svg.createSVGPoint(),p=e.getPointAtLength(e.getTotalLength()*.48);z.x=p.x;z.y=p.y;const r=z.matrixTransform(svg.getScreenCTM());return{x:r.x,y:r.y};});
   if(mobile){await p.touchscreen.tap(pt.x,pt.y);await p.locator('[data-action="ac:v33WireDelete"]').click();}else await p.mouse.click(pt.x,pt.y,{button:'right'});
   check(await p.evaluate(()=>experiments[page].edits.length===1),name+' sole wire removed '+i);
   await p.locator('[data-action="ac:check"]').click();check(await p.evaluate(()=>experiments[page].editDone),name+' one-wire correction '+i);
   await p.locator('[data-action="ac:undoEdit"]').click();check(await p.evaluate(()=>experiments[page].edits.length===0),name+' undo edit '+i);
   await p.locator('[data-action="ac:stdShow"]').click();check(await p.locator('.ac-compare svg').count()===2,name+' before-after '+i);
   await p.locator('#reset').click();continue;
  }
  // 点一根导线，选择删除，检查答案
  const hit=await p.locator('[data-action="ac:inspect"]:has(polyline)').first().evaluate(g=>{const q=g.querySelector('polyline').points,p=g.ownerSVGElement.createSVGPoint();p.x=(q[0].x+q[1].x)/2;p.y=(q[0].y+q[1].y)/2;const s=p.matrixTransform(g.ownerSVGElement.getScreenCTM());return {x:s.x,y:s.y};});
  if(mobile)await p.touchscreen.tap(hit.x,hit.y);else await p.mouse.click(hit.x,hit.y);
  const hasDel=await p.locator('[data-action="ac:editOp"][data-value="delWire"]').count();
  if(hasDel){await p.locator('[data-action="ac:editOp"][data-value="delWire"]').click();check(await p.evaluate(()=>experiments[page].edits.length===1),name+' edit applied '+i+'-'+k);}
  await p.locator('[data-action="ac:check"]').click();check(await p.evaluate(()=>typeof experiments[page].editMsg==='string'&&experiments[page].editMsg.length>0),name+' check feedback '+i+'-'+k);
  await p.locator('[data-action="ac:undoEdit"]').click();check(await p.evaluate(()=>experiments[page].edits.length===0),name+' undo edit '+i+'-'+k);
  await p.locator('[data-action="ac:stdShow"]').click();check(await p.locator('.ac-compare svg').count()===2,name+' before-after '+i+'-'+k);
  check(await p.evaluate(()=>modelData.net.edges.length>0),name+' topology '+i+'-'+k);
  if(name==='chrome'&&k===0)await p.screenshot({path:path.join(out,`correction-${i+1}.png`)});await p.locator('#reset').click();}}
 await p.evaluate(()=>goto(19));for(const id of ['S3','S4']){await p.locator(`[data-action="ac:toggle"][data-value="${id}"]`).click();const data=await p.evaluate(()=>modelData);check(id==='S3'?!data.lit.L3:data.sourceShort,name+' '+id+' response');await p.locator('#reset').click();}
 await p.evaluate(()=>{goto(12);state[page]=2;render();});check(await p.locator('.ac-flow').first().evaluate(e=>getComputedStyle(e).animationPlayState)==='paused',name+' path paused at rest');await p.locator('#play').click();await p.waitForTimeout(250);check(await p.locator('.ac-flow').first().evaluate(e=>getComputedStyle(e).animationPlayState)==='running',name+' path running');await p.locator('#play').click();const paused=await p.evaluate(()=>q());await p.waitForTimeout(350);check(await p.evaluate(x=>q()===x,paused),name+' pause');check(await p.locator('.ac-flow').first().evaluate(e=>getComputedStyle(e).animationPlayState)==='paused',name+' path paused');await p.locator('#play').click();await p.waitForTimeout(1800);check(await p.evaluate(()=>q()===3&&!playing),name+' resume');await p.locator('#reset').click();check(await p.evaluate(()=>q()===0),name+' replay');
 if(mobile){const touch=async sel=>{const b=await p.locator(sel).first().boundingBox();await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);};await p.evaluate(()=>goto(14));await touch('[data-action="ac:toggle"][data-value="S1"]');check(await p.evaluate(()=>experiments[page].switches.S1===false),name+' actual touch switch');await touch('[data-component="A1"]');check(await p.evaluate(()=>experiments[page].selected==='A1'),name+' actual touch meter');await touch('#mobile-experiment');check(await p.locator('#panel').evaluate(e=>e.open),name+' touch controls panel');await touch('#close-panel');await touch('#toc');check(await p.locator('#panel').evaluate(e=>e.open),name+' touch toc');await touch('#close-panel');await p.setViewportSize({width:390,height:844});check(await p.evaluate(()=>document.documentElement.scrollWidth<=390),name+' portrait width');}
 await c.close();}
(async()=>{const chrome=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{await run(chrome,'chrome',{width:1366,height:768});}finally{await chrome.close();}if(process.env.ADVANCED_WEBKIT){const wk=await webkit.launch({headless:true});try{await run(wk,'webkit',{width:844,height:390},true);}finally{await wk.close();}}const result={passed,failed:failed.length,details:failed};fs.writeFileSync(path.join(out,'interactions-results.json'),JSON.stringify(result,null,2));console.log(result);if(failed.length)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1;});
