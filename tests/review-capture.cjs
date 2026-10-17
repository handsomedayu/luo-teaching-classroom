const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('./browser.cjs');
const root=path.resolve(__dirname,'..'),baseline=process.env.BASELINE||'D:/小罗老师/.qa/v3-baseline';
const out=path.join(root,'reports/review-images');
const pages=[[1,7],[3,6],[4,3],[4,5],[6,3],[6,4],[7,10],[7,11],[9,3],[9,4],[10,2]];
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:1});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 for(const [chapter,n] of pages)for(const [label,dir] of [['before',baseline],['after',root]]){
  const file=path.join(dir,`physics/grade-9/electricity-${String(chapter).padStart(2,'0')}/index.html`);
  await page.goto('file:///'+file.replace(/\\/g,'/'));
  await page.evaluate(i=>{goto(i);state[page]=3;render();},n-1);
  await page.screenshot({path:path.join(out,`${chapter}-${String(n).padStart(2,'0')}-${label}.png`)});
 }
 const stages=[
  [1,7,'neutral',0],[1,7,'contact',1.5],
  [3,6,'branch-open',3],
  [7,10,'current-edge',3],
  [7,11,'voltage-edge',3],
  [9,3,'zero',0],[9,3,'half',1.5]
 ];
 for(const [chapter,n,label,step] of stages){
  const file=path.join(root,`physics/grade-9/electricity-${String(chapter).padStart(2,'0')}/index.html`);
  await page.goto('file:///'+file.replace(/\\/g,'/'));
  await page.evaluate(({i,label,step})=>{goto(i);state[page]=step;if(label==='branch-open')experiments[page].b2=false;if(label==='current-edge')experiments[page].r2=5;if(label==='voltage-edge')experiments[page].r2=10;render();},{i:n-1,label,step});
  await page.screenshot({path:path.join(out,`${chapter}-${String(n).padStart(2,'0')}-${label}.png`)});
 }
 await browser.close();if(errors.length)throw Error(errors.join('\n'));
 console.log(`Captured ${pages.length*2+stages.length} review images; 0 page errors`);
})().catch(e=>{console.error(e);process.exit(1)});
