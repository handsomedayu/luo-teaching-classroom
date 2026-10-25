'use strict';
// Only classroom website assets enter the public preview. Never publish tests,
// reports, ZIP archives, local files, source maps, or private teaching records.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'dist-review');
const include=['index.html','site.css','site.js','catalog.js','.nojekyll','shared','physics','chemistry','math'];
const allowed=new Set(['.html','.js','.css','.svg','.png','.jpg','.jpeg','.webp','.gif','.ico','.json']);
const copied=[];
function allow(source){
  const stat=fs.lstatSync(source);
  if(stat.isSymbolicLink())throw Error('Preview must not contain symlinks: '+source);
  if(stat.isDirectory())return true;
  const name=path.basename(source);
  if(name==='.nojekyll')return true;
  const ok=allowed.has(path.extname(name).toLowerCase())&&!name.startsWith('.');
  if(ok)copied.push(path.relative(root,source).replace(/\\/g,'/'));
  return ok;
}
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const name of include){
  const src=path.join(root,name);
  if(!fs.existsSync(src))throw Error('Required public site asset missing: '+name);
  fs.cpSync(src,path.join(out,name),{recursive:true,filter:allow});
}
for(const expected of ['index.html','physics/grade-9/electricity-03/index.html']){
  if(!fs.existsSync(path.join(out,expected)))throw Error('Preview missing: '+expected);
}
const info={generated_at:new Date().toISOString(),head_sha:process.env.REVIEW_HEAD_SHA||process.env.GITHUB_SHA||'local',source:'public classroom assets only',files:copied.length};
fs.writeFileSync(path.join(out,'review-build.json'),JSON.stringify(info,null,2)+'\n');
console.log('Prepared isolated preview:',info);
