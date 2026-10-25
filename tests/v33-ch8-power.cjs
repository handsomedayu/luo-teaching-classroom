'use strict';
const assert=require('assert'),path=require('path'),{chromium}=require('./browser.cjs');
const url='file:///'+path.resolve(__dirname,'../physics/grade-9/electricity-08/index.html').replace(/\\/g,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});let passed=0;
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(url);
  await page.evaluate(()=>goto(7));
  for(const [U,I,P] of [[2,.27,.54],[2.5,.3,.75]]){
   await page.locator('[data-var="lampU"]').evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},U);
   const m=await page.evaluate(()=>modelData);
   assert(Math.abs(m.U-U)<1e-8);assert(Math.abs(m.I-I)<1e-8);assert(Math.abs(m.P-P)<1e-8);passed+=3;
   assert(Math.abs(m.R-U/I)<1e-8);passed++;
  }
  await page.evaluate(()=>{goto(10);state[page]=3;render();});
  const energy=await page.evaluate(()=>modelData);
  assert.strictEqual(energy.P,1000);assert.strictEqual(energy.t,720);assert.strictEqual(energy.W,720000);passed+=3;
  assert.deepStrictEqual(errors,[]);console.log({passed,errors});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
