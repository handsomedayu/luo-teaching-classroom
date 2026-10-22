'use strict';
const assert=require('assert'),path=require('path'),{chromium}=require('./browser.cjs');
const url='file:///'+path.resolve(__dirname,'../physics/grade-9/electricity-05/index.html').replace(/\\/g,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});let passed=0;
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(url);await page.evaluate(()=>goto(6));
  for(const term of ['AC','AD','BC','BD','AB','CD']){
   await page.locator('#experiment-controls [data-var="terminal"]').selectOption(term);
   for(const pos of [0,.25,.5,.75,1]){
    await page.locator('#experiment-controls [data-var="pos"]').evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},pos);
    const seen=await page.evaluate(()=>{const r=document.querySelector('#visual-picture rect[fill="#b2d8cf"]');return {R:modelData.R,x:+r.getAttribute('x'),width:+r.getAttribute('width'),labels:document.querySelector('#visual-picture').textContent};});
    const R=term==='AB'?20:term==='CD'?0:term[0]==='A'?20*pos:20*(1-pos);
    assert(Math.abs(seen.R-R)<1e-8,`${term} ${pos} data`);passed++;
    assert(Math.abs(seen.width-26*R)<1e-8,`${term} ${pos} highlighted length`);passed++;
    assert(Math.abs(seen.x-(term[0]==='B'?120+520*pos:120))<1e-8,`${term} ${pos} highlighted start`);passed++;
    assert(['A','B','C','D','P'].every(x=>seen.labels.includes(x)),`${term} ${pos} terminal labels`);passed++;
   }
  }
  assert.deepStrictEqual(errors,[]);console.log({passed,errors});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
