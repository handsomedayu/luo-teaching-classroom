'use strict';
const assert=require('assert'),path=require('path'),{chromium}=require('./browser.cjs');
const url='file:///'+path.resolve(__dirname,'../physics/grade-9/electricity-07/index.html').replace(/\\/g,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});let passed=0;
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(url);
  await page.evaluate(()=>goto(8));
  for(const [axis,orangeX,orangeY,steeper] of [['IU',570,205,'10'],['UI',345,85,'20']]){
   await page.locator('[data-var="axis"]').selectOption(axis);
   const g=await page.evaluate(()=>{const svg=document.querySelector('#visual-picture svg'),line=svg.querySelector('line[stroke="#a04c14"]'),t=[...svg.querySelectorAll('text')].map(x=>x.textContent);return {axis:modelData.axis,x:+line.getAttribute('x2'),y:+line.getAttribute('y2'),text:t};});
   assert.strictEqual(g.axis,axis);passed++;
   assert.strictEqual(g.x,orangeX);assert.strictEqual(g.y,orangeY);passed++;
   assert(g.text.includes(axis==='IU'?'U / V':'I / A')&&g.text.includes(axis==='IU'?'I / A':'U / V'));passed++;
   const tealRise=240,tealRun=450,orangeRise=325-orangeY,orangeRun=orangeX-120;
   assert.strictEqual(tealRise/tealRun>orangeRise/orangeRun,steeper==='10');passed++;
  }
  for(const pageIndex of [5,6,7]){
   await page.evaluate(i=>goto(i),pageIndex);
   for(const [fault,I,U2] of [['normal',.2,4],['open',0,6],['short',.6,0]]){
    await page.locator('[data-var="fault"]').selectOption(fault);
    const m=await page.evaluate(()=>modelData);
    assert(Math.abs(m.I-I)<1e-8,`page ${pageIndex+1}, ${fault} current`);passed++;
    assert(Math.abs(m.U2-U2)<1e-8,`page ${pageIndex+1}, ${fault} voltage`);passed++;
   }
  }
  for(const [pageIndex,values] of [[9,[[5,true],[10,true],[20,true],[0,false]]],[10,[[5,true],[10,true],[15,false],[0,false]]]]){
   await page.evaluate(i=>goto(i),pageIndex);
   for(const [R2,safe] of values){
    await page.locator('[data-var="r2"]').evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},R2);
    const m=await page.evaluate(()=>modelData);
    assert.strictEqual(m.safe,safe,`page ${pageIndex+1}, R2=${R2}`);passed++;
    assert(Math.abs(m.I-6/(10+R2))<1e-8);passed++;
    assert(Math.abs(m.U2-6*R2/(10+R2))<1e-8);passed++;
   }
  }
  assert.deepStrictEqual(errors,[]);console.log({passed,errors});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
