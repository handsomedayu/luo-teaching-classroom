'use strict';
const lessons=LESSON.pages,$=id=>document.getElementById(id),state=lessons.map(()=>0),experiments=lessons.map(initial);
let page=0,playing=false,raf=0,last=0,target=0,panelMode='',inputRaf=0,syncKey='',revealKey=-1;
const continuous=new Set(['charge','force','scope','power','joule','current','circuit','ohm','safety','lamp']);
const html=(id,value)=>ClassroomDOM.html($(id),value);
let motionData={};
const q=()=>state[page],coarse=matchMedia('(pointer:coarse) and (max-width:1000px)');
const setText=(id,text)=>{if($(id).textContent!==text)$(id).textContent=text;};
const notes='本课为待教师审核样稿。教材版次及海南中考逐条要求未核实。电路采用理想电源、导线与电表；定值电阻温度不变。动画不代表真实电子速度。';
function pause(){playing=false;cancelAnimationFrame(raf);sync();}
function sync(){
 const n=lessons[page].steps.length,key=[page,Math.floor(q()),q()===0,q()>=n,playing].join(':');if(key===syncKey)return;syncKey=key;
 setText('page-count',`${page+1} / ${lessons.length}`);setText('step-count',`${Math.floor(q())} / ${n}`);
 $('prev').disabled=page===0;$('next').disabled=page===lessons.length-1;$('back').disabled=q()===0;$('step').disabled=q()>=n;
 $('play').hidden=false;setText('play',playing?'暂停':'连续播放');$('progress').style.width=`${(page+1)/lessons.length*100}%`;
 document.querySelectorAll('.mobile-controls [data-control]').forEach(b=>{const a=$(b.dataset.control);b.disabled=a.disabled;if(b.dataset.control==='play')b.textContent=playing?'暂停':'播放';});
}
function reveal(){
 const key=Math.floor(q());if(key!==revealKey){revealKey=key;document.querySelectorAll('[data-reveal]').forEach(e=>{const visible=q()>=Number(e.dataset.reveal);e.classList.toggle('pending',!visible);e.setAttribute('aria-hidden',!visible);});}sync();
}
function paintMotion(){updateMotion($('visual-picture'),lessons[page],experiments[page],q(),motionData);window.modelData=motionData;reveal();}
function render(keepControls=false){
 const p=lessons[page],m=renderModel(p,experiments[page],continuous.has(p.scene)?0:q());motionData=m.data;
 html('visual-picture',m.picture);html('readings',m.metrics);setText('caption',m.caption);
 if(!keepControls)html('experiment-controls',m.controls);
 paintMotion();
 if(panelMode==='experiment'&&$('panel').open)html('mobile-readings',$('readings').innerHTML);
}
function flushInput(){if(inputRaf){cancelAnimationFrame(inputRaf);inputRaf=0;render();}}
function goto(i){
 flushInput();pause();revealKey=-1;page=Math.max(0,Math.min(lessons.length-1,i));const p=lessons[page];
 setText('title',p.title);setText('question',p.question);setText('section',`第 ${LESSON.number} 章 · ${LESSON.title}`);
 $('content').innerHTML='<div class="page split"><section class="visual"><div id="visual-picture"></div><div id="readings"></div><p id="caption" class="small"></p><div id="experiment-controls" class="experiment-controls"></div></section><section class="facts">'+p.steps.map((t,i)=>`<p class="fact" data-reveal="${i+1}">${t}</p>`).join('')+'<p class="ask">先预测 → 操作或分步观察 → 说明依据</p></section></div>';
 setText('model-note',p.scene==='home'?'安全示意，不是施工图；不进行市电接线。':p.scene==='graph'||p.scene==='lamp'?'示例/理想数据，不是实际测量记录；实验仍须观察真实误差。':'教学简化模型；电源、导线与电表理想化，动态箭头不表示真实电子速度。');
 render();if(matchMedia('(max-width:700px) and (orientation:portrait)').matches)window.scrollTo(0,0);if($('panel').open)$('panel').close();$('toc').setAttribute('aria-expanded','false');
}
function animate(to){
 flushInput();pause();target=to;playing=true;last=performance.now();sync();
 function frame(now){const old=Math.floor(q());state[page]=Math.min(target,q()+Math.max(0,Math.min(now-last,100))/1500);last=now;
  if(continuous.has(lessons[page].scene))paintMotion();else if(Math.floor(q())!==old)render(true);
  if(q()>=target){playing=false;sync();}else raf=requestAnimationFrame(frame);
 }raf=requestAnimationFrame(frame);
}
function change(e){
 const v=e.target.dataset.var;if(!v)return;pause();experiments[page].feedback='';const old=experiments[page][v];experiments[page][v]=typeof old==='number'?Number(e.target.value):e.target.value;
 if(e.target.type==='range'){if(!inputRaf)inputRaf=requestAnimationFrame(()=>{inputRaf=0;render();});}else{flushInput();render();}
}
function action(e){
 const b=e.target.closest('[data-action]');if(!b)return;flushInput();pause();const k=b.dataset.action,s=experiments[page];
 if(k==='record'){const m=renderModel(lessons[page],s,q()).data;s.feedback=!s.closed?'请先闭合开关。':lessons[page].mode==='resistance'&&Math.abs(m.U-3)>.01?'先把 U₁ 调回 3 V，再记录比较。':'';if(!s.feedback){s.records=[...(s.records||[]),{U:m.U,I:m.I,R:m.R}].slice(-3);}}else if(k==='mode')s.mode=s.mode==='series'?'parallel':'series';else if(k==='charge')s.charge*=-1;else if(k==='load')s.load=(s.load+1)%3;else s[k]=!s[k];render();
 if(panelMode==='experiment'&&$('panel').open)openPanel('experiment');
}
$('content').addEventListener('input',change);$('content').addEventListener('change',flushInput);$('content').addEventListener('click',action);
$('panel-content').addEventListener('input',change);$('panel-content').addEventListener('change',flushInput);$('panel-content').addEventListener('click',e=>{if(e.target.closest('[data-jump]'))goto(Number(e.target.closest('[data-jump]').dataset.jump));else action(e);});
function openPanel(mode){
 flushInput();pause();panelMode=mode;$('panel').className=mode==='toc'?'toc-panel':'';
 if(mode==='toc'){setText('panel-title','课堂目录');$('panel-content').innerHTML='<div class="toc-grid">'+lessons.map((p,i)=>`<button data-jump="${i}" ${i===page?'aria-current="page"':''}>${i+1}. ${p.title}</button>`).join('')+'</div>';}
 else if(mode==='experiment'){setText('panel-title','实验操作');const m=renderModel(lessons[page],experiments[page],q());$('panel-content').innerHTML='<div id="mobile-readings">'+m.metrics+'</div><div class="experiment-controls">'+(m.controls||'<p>本页使用分步按钮观察模型，无额外参数。</p>')+'</div>';}
 else{setText('panel-title','教师讲解提示');$('panel-content').innerHTML='<p>'+lessons[page].teacher+'</p><p class="small">'+notes+'</p>';}
 if(!$('panel').open)$('panel').showModal();$('toc').setAttribute('aria-expanded',mode==='toc');
 if(mode==='toc')$('panel-content').querySelector('[aria-current]')?.scrollIntoView({block:'nearest'});
}
$('toc').onclick=()=>openPanel('toc');$('notes').onclick=()=>openPanel('notes');
$('close-panel').onclick=()=>$('panel').close();$('panel').addEventListener('close',()=>$('toc').setAttribute('aria-expanded','false'));
$('panel').addEventListener('click',e=>{const r=$('panel').getBoundingClientRect();if(e.target===$('panel')&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))$('panel').close();});
$('prev').onclick=()=>goto(page-1);$('next').onclick=()=>goto(page+1);
$('back').onclick=()=>{pause();state[page]=Math.max(0,Math.ceil(q())-1);render();};
$('step').onclick=()=>{pause();animate(Math.min(lessons[page].steps.length,Math.floor(q()+.00001)+1));};
$('play').onclick=()=>{if(playing)pause();else{if(q()>=lessons[page].steps.length)state[page]=0;animate(lessons[page].steps.length);}};
$('reset').onclick=()=>{flushInput();pause();state[page]=0;experiments[page]=initial(lessons[page]);render();};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else{$('status').hidden=false;$('status').textContent='此浏览器不支持网页全屏，请横屏观看。';}}catch{$('status').hidden=false;$('status').textContent='浏览器未允许全屏，请使用横屏或浏览器全屏功能。';}};
document.addEventListener('keydown',e=>{
 if($('panel').open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
 const keys={ArrowRight:'next',PageDown:'next',ArrowLeft:'prev',PageUp:'prev',' ':'step',r:'reset',R:'reset',f:'fullscreen',F:'fullscreen',n:'notes',N:'notes'};
 if(e.key==='Home'){e.preventDefault();goto(0);}else if(e.key==='End'){e.preventDefault();goto(lessons.length-1);}else if(keys[e.key]){e.preventDefault();if(e.key===' '&&playing)pause();else $(keys[e.key]).click();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){flushInput();pause();}});
const mobile=document.createElement('nav');mobile.className='mobile-controls';mobile.setAttribute('aria-label','手机课堂控制');mobile.innerHTML='<button id="mobile-experiment">实验</button>'+[['prev','前页'],['back','回退'],['step','分步'],['play','播放'],['reset','重播'],['next','后页']].map(([id,t])=>`<button data-control="${id}">${t}</button>`).join('');document.body.append(mobile);
mobile.onclick=e=>{const id=e.target.dataset.control;if(id)$(id).click();else if(e.target.id==='mobile-experiment')openPanel('experiment');};
function fit(){if(matchMedia('(max-width:700px) and (orientation:portrait)').matches){Object.assign($('stage').style,{transform:'none',left:'0',top:'0'});return;}const w=document.documentElement.clientWidth,h=document.documentElement.clientHeight-(coarse.matches?52:0),s=Math.min(w/1600,h/900);Object.assign($('stage').style,{transform:`scale(${s})`,left:(w-1600*s)/2+'px',top:(h-900*s)/2+'px'});}
let fitRaf=0;const scheduleFit=()=>{if(!fitRaf)fitRaf=requestAnimationFrame(()=>{fitRaf=0;fit();});};addEventListener('resize',scheduleFit);coarse.addEventListener('change',scheduleFit);visualViewport?.addEventListener('resize',scheduleFit);goto(0);fit();
