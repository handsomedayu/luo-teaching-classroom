'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync,execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results','pr17-evidence');
fs.mkdirSync(out,{recursive:true});
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const report={schema:1,sha:git('rev-parse','HEAD'),startedAt:new Date().toISOString(),platform:process.platform,node:process.version,dirty:git('status','--porcelain'),browsers:{chrome:'C:/Program Files/Google/Chrome/Application/chrome.exe',playwright:require(path.join(process.env.PLAYWRIGHT_PATH||'C:/Users/0/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright','package.json')).version,viewports:['Chrome 1920x1080','Chrome 1366x768','WebKit touch 844x390','WebKit portrait touch 390x844 (P31 only)'],network:'browser suites block external HTTP(S)'},commands:[],sourceHashes:{},screenshots:[]};
const env={...process.env,P23_WEBKIT:'1',ADVANCED_WEBKIT:'1'};
for(const script of ['tests/science.cjs','tests/ch3-batch1.cjs','tests/network.cjs','tests/advanced-circuits.cjs','tests/interact-circuits.cjs','tools/build-review-preview.cjs','tests/v33-p31.cjs','tests/v33-p14.cjs','tests/v33-p21.cjs','tests/v33-p22.cjs','tests/v32-p23.cjs','tests/v33-p24.cjs','tests/v33-p25.cjs','tests/v33-p26.cjs','tests/v33-p27.cjs','tests/v33-p28.cjs','tests/v32-p29.cjs','tests/v33-p30.cjs','tests/advanced-interactions.cjs','tests/advanced-browser.cjs']){
  const start=new Date().toISOString(),r=spawnSync(process.execPath,[script],{cwd:root,env,encoding:'utf8',timeout:600000,maxBuffer:4*1024*1024});
  const log=script.replace(/[/.]/g,'-')+'.log';
  fs.writeFileSync(path.join(out,log),(r.stdout||'')+(r.stderr||'')+(r.error?'\n'+r.error.message:''));
  report.commands.push({command:'node '+script,startedAt:start,finishedAt:new Date().toISOString(),exitCode:r.status,error:r.error?.message||null,log});
  console.log(script+': '+(r.status===0?'PASS':'FAIL'));
}
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const file of ['physics/grade-9/electricity-03/advanced.js','physics/grade-9/electricity-03/advanced.css','physics/grade-9/electricity-03/lesson.js','tests/v33-p31.cjs','tests/v33-p14.cjs','tests/interact-circuits.cjs'])report.sourceHashes[file]=hash(path.join(root,file));
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.png'))report.screenshots.push({path:path.relative(root,p).replace(/\\/g,'/'),sha256:hash(p)});}}
walk(path.join(root,'test-results'));
report.suites={};
for(const file of ['science-results.json','ch3-batch1/after/results.json','network.json','v33-p31/results.json','v33-p14/results.json','v33-p21/results.json','v33-p22/results.json','v32-p23/results.json','v33-p24/results.json','v33-p25/results.json','v33-p26/results.json','v33-p27/results.json','v33-p28/results.json','v32-p29-clickwire/results.json','v33-p30/results.json','advanced-circuits/interactions-results.json','advanced-circuits/browser-results.json']){
  const p=path.join(root,'test-results',file);
  report.suites[file]=fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):{failed:1,error:'Missing result'};
}
report.finishedAt=new Date().toISOString();report.failed=report.commands.filter(x=>x.exitCode!==0).length+Object.values(report.suites).reduce((n,s)=>n+(s.failed||0),0);
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({sha:report.sha,failedCommands:report.commands.filter(x=>x.exitCode!==0).length,failedChecks:report.failed,screenshots:report.screenshots.length,manifest:'test-results/pr17-evidence/manifest.json'}));
if(report.failed)process.exitCode=1;
