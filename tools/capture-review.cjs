'use strict';
// Read-only browser captures. This intentionally does not claim pedagogical
// correctness or that all hands-on interactions were successfully tested.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'test-results','classroom-review');
fs.mkdirSync(out,{recursive:true});
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'catalog.js'),'utf8'),ctx);
const lessons=ctx.window.CLASSROOM.flatMap(subject=>subject.grades.flatMap(grade=>grade.lessons.map(lesson=>({
  subject:subject.id,grade:grade.id,chapter:lesson.id,declared:lesson.pages,title:lesson.title
}))));
const report={generated_at:new Date().toISOString(),head_sha:process.env.REVIEW_HEAD_SHA||process.env.GITHUB_SHA||'local',
 environment:'Playwright Chromium automated screenshots (not teacher acceptance)',chapters:[],errors:[],warnings:[],screenshots:0};
let active='';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1});
  await context.route(/^https?:/,route=>route.abort());
  const tab=await context.newPage();
  tab.on('pageerror',error=>report.errors.push({page:active,message:error.message}));
  tab.on('requestfailed',req=>{if(req.url().startsWith('file:'))report.errors.push({page:active,message:'Missing local resource: '+req.url()});});
  for(const item of lessons){
    active=[item.subject,item.grade,item.chapter].join('/');
    const filepath=path.join(root,item.subject,item.grade,item.chapter,'index.html');
    if(!fs.existsSync(filepath)){report.errors.push({page:active,message:'Chapter index.html not found'});continue;}
    try{
      await tab.goto('file:///'+filepath.replace(/\\/g,'/'),{waitUntil:'load'});
      const capability=await tab.evaluate(()=>({
        count:typeof lessons!=='undefined'&&Array.isArray(lessons)?lessons.length:0,
        go:typeof goto==='function'?'goto':typeof go==='function'?'go':null
      }));
      if(!capability.go||capability.count<1)throw Error('Chapter navigation unavailable');
      const count=capability.count;
      if(count!==item.declared)report.warnings.push({page:active,message:'Catalog pages '+item.declared+' vs actual '+count+'; navigation metadata may be outdated'});
      const record={path:active,pages:count,catalog_pages:item.declared};
      report.chapters.push(record);
      for(let i=0;i<count;i++){
        active=record.path+' page '+(i+1);
        try{
          await tab.evaluate(i=>{
            if(typeof goto==='function')goto(i);
            else if(typeof go==='function')go(i);
            if(typeof state!=='undefined'&&typeof page!=='undefined'&&state&&Object.prototype.hasOwnProperty.call(state,page))state[page]=3;
            if(typeof render==='function')render();
          },i);
          const fn=[item.subject,item.grade,item.chapter,'p'+String(i+1).padStart(2,'0')].join('-')+'.png';
          await tab.screenshot({path:path.join(out,fn),animations:'disabled',timeout:12000});
          report.screenshots++;
        }catch(error){report.errors.push({page:active,message:'Screenshot failed: '+error.message});}
      }
    }catch(error){report.errors.push({page:active,message:error.message});}
  }
  await browser.close();
})().catch(error=>report.errors.push({page:active,message:'Browser failure: '+error.message}))
 .finally(()=>{
   fs.writeFileSync(path.join(out,'review-report.json'),JSON.stringify(report,null,2)+'\n');
   const summary=['# Classroom browser evidence','', 'Commit: '+report.head_sha,
     'Chapters visited: '+report.chapters.length, 'Page screenshots: '+report.screenshots,
     'Browser errors: '+report.errors.length,'Warnings: '+report.warnings.length,
     '', 'These are visual/browser smoke checks, not scientific or teacher acceptance.',
     'Actual circuit interactions require targeted tests and teacher review.',''];
   fs.writeFileSync(path.join(out,'README.md'),summary.join('\n'));
   console.log(summary.join('\n'));
   if(report.errors.length){console.error(JSON.stringify(report.errors.slice(0,15),null,2));process.exitCode=1;}
 });
