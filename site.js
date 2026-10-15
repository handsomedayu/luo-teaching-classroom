(()=>{
const {root,subject,grade}=document.body.dataset,data=window.CLASSROOM,s=data.find(x=>x.id===subject),g=s?.grades.find(x=>x.id===grade),esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),link=(path,label)=>`<a href="${root+path}index.html">${esc(label)}</a>`,count=s=>s.grades.reduce((n,g)=>n+g.lessons.length,0);
const icons={math:'<path d="M4 21V4m0 17h17M7 17l5-9 7 6"/><circle cx="12" cy="8" r="1"/>',physics:'<path d="M9 4h6m-3 0v6m-5 0h10v4a5 5 0 0 1-10 0zM4 20h16"/>',chemistry:'<path d="M9 3h6m-5 0v7L5 19a1 1 0 0 0 1 2h12a1 1 0 0 0 1-2l-5-9V3M8 15h8"/>'};
const icon=id=>`<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[id]}</svg></span>`;
const card=(href,title,body,foot,head='')=>`<a class="card${g?' chapter':''}" href="${root+href}index.html">${head}<h2>${esc(title)}</h2><p>${esc(body)}</p><div class="card-bottom"><span>${esc(foot)}</span><span class="arrow" aria-hidden="true">→</span></div></a>`;
document.querySelector('.brand').href=root+'index.html';
document.querySelector('.crumbs').innerHTML=s?`${link('','首页')}<span aria-hidden="true">/</span>${g?link(s.id+'/',s.name)+'<span aria-hidden="true">/</span><span aria-current="page">'+esc(g.name)+'</span>':'<span aria-current="page">'+esc(s.name)+'</span>'}`:'<span aria-current="page">教学资源 / 学科目录</span>';
document.querySelector('.eyebrow').textContent=g?'按章节进入课堂':s?'选择年级':'教师交互式 HTML 课件';
document.querySelector('h1').textContent=g?s.name+' · '+g.name:s?s.name+'课堂':'选择学科，开始课堂';
document.title=(g?s.name+' · '+g.name:s?s.name+'课堂':'三科学科目录')+'｜罗老师数理化课堂';
document.querySelector('.intro').textContent=g?(g.lessons.length?'选择章节，按课堂节奏逐步观察、推理与归纳。':'本年级的章节与专题将在完成后加入这里。'):s?s.summary:'数学、物理、化学，一个入口。先选学科，再选年级，打开课堂。';
document.querySelector('#list-title').textContent=g?'章节与专题':s?'年级目录':'学科目录';
document.querySelector('#list-count').textContent=g?(g.lessons.length?g.lessons.length+' 章已上线':'待添加'):s?s.grades.length+' 个年级':'3 个学科';
const grid=document.querySelector('#cards');
if(!s)grid.innerHTML=data.map(x=>card(x.id+'/',x.name,x.summary,count(x)?count(x)+' 章已上线 · 选择年级':'课件待添加 · 查看年级',icon(x.id))).join('');
else if(!g)grid.innerHTML=s.grades.map(x=>card(s.id+'/'+x.id+'/',x.name,x.lessons.length?x.lessons.length+' 章课堂课件':'章节与专题待添加','查看年级目录',icon(s.id))).join('');
else if(g.lessons.length){grid.classList.add('lesson-grid');grid.innerHTML=g.lessons.map((x,i)=>card(s.id+'/'+g.id+'/'+x.id+'/',x.title,x.pages+' 页 · 分步演示与交互动画'+(x.review?' · 待教师审核':''),'进入课堂',`<span class="chapter-no">第 ${i+1} 章</span>`)).join('')}
else{grid.className='';grid.innerHTML='<section class="empty" aria-label="课件状态"><h2>课件待添加</h2><p>本年级暂未上线课件。已完成的章节会显示在此处，点击即可进入课堂。</p></section>'}
document.querySelector('.notice').textContent=g?.lessons.some(x=>x.review)?'第四、第五章使用最新成品，仍待老师教学审核。微观模型用于教学，不代表真实微观影像。':'电脑适合课堂投影；手机打开课件后，建议横屏观看。';
})();
