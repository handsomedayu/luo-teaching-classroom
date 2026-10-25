'use strict';
const assert=require('assert'),path=require('path'),{chromium}=require('./browser.cjs');
const url='file:///'+path.resolve(__dirname,'../physics/grade-9/electricity-10/index.html').replace(/\\/g,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});let passed=0;
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(url);
  const before=await page.evaluate(()=>{goto(10);state[page]=0;render();return modelData;});
  assert.strictEqual(before.P,3200);assert(Math.abs(before.I-3200/220)<1e-9);passed+=2;
  const after=await page.evaluate(()=>{state[page]=1;render();return modelData;});
  assert.strictEqual(after.P,3300);assert.strictEqual(after.I,15);passed+=2;
  assert((await page.locator('body').innerText()).includes('右侧 3200 W，再开 100 W 灯'));passed++;
  const diagram=await page.locator('#visual-picture').innerHTML();
  assert(diagram.includes('火线开关'));assert(diagram.includes('金属外壳接PE'));passed+=2;
  await page.screenshot({path:path.resolve(__dirname,'../test-results/v33-ch10-p11.png')});
  assert.deepStrictEqual(errors,[]);console.log({passed,errors});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
