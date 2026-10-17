const fs=require('fs'),path=require('path'),{chromium,webkit}=require('./browser.cjs');
const root=path.resolve(__dirname,'../physics/grade-9'),out=path.resolve(__dirname,'../test-results'),chapters=Array.from({length:10},(_,i)=>({id:'electricity-'+String(i+1).padStart(2,'0'),pages:i===5?14:i===7?13:12})).filter((c,i)=>!process.env.PHYSICS_CHAPTERS||process.env.PHYSICS_CHAPTERS.split(',').map(Number).includes(i+1));fs.mkdirSync(out,{recursive:true});
const base=process.env.PHYSICS_BASE||'file:///'+root.replace(/\\/g,'/')+'/';
const mode=process.env.PHYSICS_MODE||'all',suffix=process.env.PHYSICS_CHAPTERS?'-retest':'';
const started=new Date().toISOString(),crypto=require('crypto'),sourceHashes=Object.fromEntries(['models.js','runtime.js','style.css'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(root+'/shared/'+f)).digest('hex')]));
function checkpoint(chapter){fs.writeFileSync(out+'/progress-'+mode+suffix+'.json',JSON.stringify({started,chapter,sourceHashes,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,errors},null,2));}
const results=[],errors=[];let tag='';function check(ok,label,details){results.push({tag,label,pass:!!ok,...(!ok?{details}: {})});if(!ok)console.log('FAIL',tag,label,JSON.stringify(details));}
async function click(page,selector,mobile=false){if(mobile){const b=await page.locator(selector).boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);}else await page.locator(selector).click();}
async function layout(page){return page.evaluate(()=>{const cr=document.querySelector('#content').getBoundingClientRect(),bad=[];for(const e of document.querySelectorAll('.visual,.facts,#experiment-controls,#readings,#caption')){const r=e.getBoundingClientRect();if(r.bottom>cr.bottom+3||r.right>cr.right+3||e.scrollWidth>e.clientWidth+3||e.scrollHeight>e.clientHeight+3)bad.push([e.id||e.className,Math.round(r.bottom-cr.bottom),e.scrollWidth-e.clientWidth,e.scrollHeight-e.clientHeight]);}const s=document.querySelector('#stage').getBoundingClientRect();return {bad,stage:s.toJSON(),w:document.documentElement.clientWidth,h:document.documentElement.clientHeight};});}
async function desktop(browser,width,height){
 const context=await browser.newContext({viewport:{width,height}});if(base.startsWith('file:'))await context.route(/^https?:/,r=>r.abort());const page=await context.newPage();await page.clock.install();page.on('pageerror',e=>errors.push({tag,message:e.message}));
 for(const chapter of chapters){tag=`desktop-${width}-${chapter.id}`;await page.goto(base+chapter.id+'/index.html');await page.waitForFunction(()=>typeof q==='function'&&document.querySelector('.page'));
  check(await page.locator('#page-count').textContent()===`1 / ${chapter.pages}`,'页数与清单同步');
  for(let i=0;i<chapter.pages;i++){
   tag=`desktop-${width}-${chapter.id}-${i+1}`;
   await page.locator('#reset').click();
   for(let k=1;k<=3;k++){await page.locator('#step').click();await page.clock.runFor(1600);check(await page.locator('[data-reveal]:not(.pending)').count()===k,'逐步揭示 '+k);}
   const l=await layout(page);check(l.bad.length===0,'布局无越界',l.bad);
   await page.locator('#back').click();check(await page.evaluate(()=>q()===2),'回退');
   await page.locator('#reset').click();await page.locator('#play').click();await page.clock.runFor(300);await page.locator('#play').click();let paused=await page.evaluate(()=>q());await page.clock.runFor(500);check(await page.evaluate(n=>q()===n,paused),'暂停保持');
   await page.locator('#play').click();await page.clock.runFor(5000);check(await page.evaluate(()=>q()===3&&!playing),'继续到终点');
   const controls=await page.locator('#experiment-controls [data-var]').count();
   for(let k=0;k<controls;k++){
    const el=page.locator('#experiment-controls [data-var]').nth(k),type=await el.evaluate(e=>e.tagName);
    if(type==='SELECT'){if(await el.isDisabled()){await page.locator('#experiment-controls [data-action=closed]').click();}const options=await el.locator('option').evaluateAll(els=>els.map(e=>e.value));for(const option of options){await el.selectOption(option);check(await el.inputValue()===option,'选择参数 '+option);}}
    else {for(const end of ['min','max']){await el.evaluate((e,a)=>{e.value=e[a];e.dispatchEvent(new Event('input',{bubbles:true}));},end);await page.clock.runFor(32);check(Number(await el.inputValue())===Number(await el.getAttribute(end)),'滑片端点 '+end);}}
   }
   const actions=await page.locator('#experiment-controls [data-action]').count();for(let k=0;k<actions;k++){await page.locator('#experiment-controls [data-action]').nth(k).click();await page.locator('#experiment-controls [data-action]').nth(k).click();check(true,'实验按钮 '+k);}
   check((await layout(page)).bad.length===0,'参数改变后布局');
   if(width===1366&&[0,Math.floor(chapter.pages/2),chapter.pages-1].includes(i))await page.screenshot({path:out+`/${chapter.id}-${i+1}.png`});
   if(i<chapter.pages-1){await page.locator('#next').click();check(await page.evaluate(()=>page)===i+1,'下一页');}
  }
  await page.locator('#toc').click();check(await page.locator('[data-jump]').count()===chapter.pages,'目录完整');check(await page.locator('[aria-current=page]').textContent()===`${chapter.pages}. ${await page.locator('#title').textContent()}`,'当前页高亮');
  const scroll=await page.locator('#panel-content').evaluate(e=>({height:e.clientHeight,total:e.scrollHeight}));await page.locator('#panel-content').hover();await page.mouse.wheel(0,-1800);await page.clock.runFor(400);check(scroll.total<=scroll.height||await page.locator('#panel-content').evaluate(e=>e.scrollTop)<scroll.total-scroll.height,'目录滚动或完整显示');
  await page.locator('[data-jump="0"]').click();check(await page.evaluate(()=>page===0&&!document.querySelector('#panel').open),'目录跳转收起');
  await page.locator('#toc').click();await page.keyboard.press('Escape');check(!await page.locator('#panel').evaluate(e=>e.open),'Esc关闭');
  await page.locator('#toc').click();await page.mouse.click(width-20,height/2);check(!await page.locator('#panel').evaluate(e=>e.open),'外部关闭');
  await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');check(await page.evaluate(()=>page===0),'键盘左右');
  await page.locator('#notes').click();check(await page.locator('#panel-content').textContent().then(t=>t.includes('未核实')),'教师备注');await page.locator('#close-panel').click();
  await page.locator('#fullscreen').click();check(await page.evaluate(()=>!!document.fullscreenElement),'全屏进入');await page.locator('#fullscreen').click();check(await page.evaluate(()=>!document.fullscreenElement),'全屏退出');
  checkpoint(chapter.id);console.log('DONE',tag);
 }
 await context.close();
}
async function mobile(browser,name){const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await context.newPage();await page.setViewportSize({width:844,height:390});await page.clock.install();page.on('pageerror',e=>errors.push({tag,message:e.message}));
 for(const chapter of chapters){tag=`${name}-${chapter.id}`;await page.goto(base+chapter.id+'/index.html');await page.waitForFunction(()=>typeof q==='function'&&document.querySelector('.page'));
  for(let i=0;i<chapter.pages;i++){await click(page,'.mobile-controls [data-control="play"]',true);await page.clock.runFor(5000);const l=await layout(page);check(!l.bad.length&&l.stage.right<=l.w+1&&l.stage.bottom<=l.h-51,'横屏页面 '+(i+1),l);if(i<chapter.pages-1)await click(page,'.mobile-controls [data-control="next"]',true);}
  await click(page,'.mobile-controls [data-control="back"]',true);check(await page.evaluate(()=>q()===2),'触控回退');await click(page,'.mobile-controls [data-control="reset"]',true);check(await page.evaluate(()=>q()===0),'触控重播');await click(page,'.mobile-controls [data-control="step"]',true);await page.clock.runFor(1600);check(await page.evaluate(()=>q()===1),'触控分步');
  await click(page,'#fullscreen',true);check(await page.evaluate(()=>!!document.fullscreenElement||!document.querySelector('#status').hidden),'手机全屏或明确降级');if(await page.evaluate(()=>!!document.fullscreenElement))await click(page,'#fullscreen',true);
  await click(page,'#toc',true);await page.locator('[data-jump="1"]').click();check(await page.evaluate(()=>page===1),'触控目录跳转');
  const interactive=await page.evaluate(()=>lessons.findIndex((p,i)=>renderModel(p,experiments[i],0).controls.includes('data-var')));if(interactive>=0){await click(page,'#toc',true);await page.locator(`[data-jump="${interactive}"]`).click();}
  await click(page,'#mobile-experiment',true);check(await page.locator('#panel').evaluate(e=>e.open),'手机实验面板');const range=page.locator('#panel input[type=range]').first();if(await range.count()){const b=await range.boundingBox();await page.touchscreen.tap(b.x+b.width*.8,b.y+b.height/2);await page.clock.runFor(32);const key=await range.getAttribute('data-var');check(await page.locator(`#experiment-controls [data-var="${key}"]`).inputValue()===await range.inputValue(),'触控调节同步主画面');}const select=page.locator('#panel select').first();if(await select.count()){const last=await select.locator('option').last().getAttribute('value');await select.selectOption(last);const key=await select.getAttribute('data-var');check(await page.locator(`#experiment-controls [data-var="${key}"]`).inputValue()===last,'手机下拉框同步主画面');}await click(page,'#close-panel',true);
  await page.setViewportSize({width:390,height:844});await page.clock.runFor(100);await page.waitForFunction(()=>document.querySelector('#stage').getBoundingClientRect().right<=391);check(await page.evaluate(()=>document.documentElement.scrollWidth<=391&&getComputedStyle(document.querySelector('.fact')).fontSize==='19px'&&document.querySelector('#stage').getBoundingClientRect().height>700),'竖屏阅读排版');await page.setViewportSize({width:844,height:390});await page.clock.runFor(100);await page.waitForFunction(()=>document.querySelector('#stage').getBoundingClientRect().bottom<=339);
  await page.screenshot({path:out+`/${name}-${chapter.id}.png`});checkpoint(chapter.id);console.log('DONE',tag);
 }await context.close();}
(async()=>{if(mode!=='webkit'){const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{if(['all','1920'].includes(mode))await desktop(b,1920,1080);if(['all','1366'].includes(mode))await desktop(b,1366,768);if(['all','mobile'].includes(mode))await mobile(b,'chrome-mobile');}finally{await b.close();}}if(['all','webkit'].includes(mode)){const w=await webkit.launch({headless:true});try{await mobile(w,'webkit-mobile');}finally{await w.close();}}check(errors.length===0,'无脚本错误',errors);fs.writeFileSync(out+'/results-'+mode+suffix+'.json',JSON.stringify({base,started,sourceHashes,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,errors,results},null,2));console.log(JSON.stringify({passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,errors}));})().catch(e=>{fs.writeFileSync(out+'/interrupted-'+mode+suffix+'.json',JSON.stringify({error:e.stack,results,errors},null,2));console.error(e);process.exit(1)});
