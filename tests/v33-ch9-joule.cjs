'use strict';
const assert=require('assert'),path=require('path'),{chromium}=require('./browser.cjs');
const url='file:///'+path.resolve(__dirname,'../physics/grade-9/electricity-09/index.html').replace(/\\/g,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});let passed=0;
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(url);
  for(const [index,expected] of [[2,{I1:.5,I2:.5,R1:10,R2:20,t:60,Q1:150,Q2:300}],[3,{I1:.5,I2:1,R1:10,R2:10,t:60,Q1:150,Q2:600}],[4,{I1:.5,I2:.5,R1:10,R2:10,t:60,Q1:150,Q2:150}],[7,{I1:.5,I2:.5,R1:20,R2:20,t:120,Q1:600,Q2:600}]]){
   const actual=await page.evaluate(i=>{goto(i);state[page]=3;render();return modelData;},index);
   for(const [key,value] of Object.entries(expected)){assert.strictEqual(actual[key],value,`page ${index+1} ${key}`);passed++;}
   const labels=await page.locator('[data-heat-text]').allTextContents();
   assert(labels.some(s=>s.includes(`${expected.Q1} J`)));passed++;
   if(index===2||index===3)await page.screenshot({path:path.resolve(__dirname,`../test-results/v33-ch9-p${index+1}.png`)});
  }
  assert.deepStrictEqual(errors,[]);console.log({passed,errors});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
