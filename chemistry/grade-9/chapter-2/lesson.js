const $=s=>document.querySelector(s);
let page=0,playing=false,target=0,last=0,raf=0,returnFocus=null;
const q=()=>state[page],rev=(n,html)=>`<div data-reveal="${n}" class="${q()>=n?'':'pending'}">${html}</div>`;
const fact=s=>`<div class="fact">${s}</div>`,facts=items=>`<div class="facts">${items.map((s,i)=>rev(i+1,fact(s))).join('')}</div>`;
const call=(n,s,warning=false)=>rev(n,`<div class="callout ${warning?'warning':''}">${s}</div>`);
const split=(left,right,wide=false)=>`<div class="split ${wide?'wide-left':''}">${left}<div>${right}</div></div>`;
const visual=(html,label='')=>`<div class="visual">${html}${label?`<p class="caption">${label}</p>`:''}</div>`;
const card=(title,body,cls='')=>`<div class="card ${cls}"><h2>${title}</h2>${body}</div>`;
function diagram(z,layers,options={}){
 const {visible=layers.length,highlight=-1,nucleus=false}=options,cx=75,cy=180;
 let svg=`<svg class="textbook" viewBox="0 0 380 360" role="img" data-z="${z}" data-layout="${layers.join(',')}" aria-label="教材式结构示意图，核电荷数${z}，已显示的各层电子数：${layers.slice(0,visible).join('、')||'待揭示'}"><circle class="nucleus ${nucleus?'highlight':''}" cx="${cx}" cy="${cy}" r="31"/><text class="nucleus-label ${nucleus?'highlight':''}" x="${cx}" y="${cy+12}">+${z}</text>`;
 layers.forEach((count,i)=>{let r=64+42*i,a=Math.PI/3,g=Math.asin(25/r),pt=t=>`${cx+r*Math.cos(t)} ${cy+r*Math.sin(t)}`;
 svg+=`<g class="layer ${i>=visible?'pending':''} ${i===highlight?'highlight':''}" data-layer="${i+1}" data-count="${count}"><path class="shell-arc" d="M${pt(-a)} A${r} ${r} 0 0 1 ${pt(-g)} M${pt(g)} A${r} ${r} 0 0 1 ${pt(a)}"/><text class="layer-count" x="${cx+r}" y="${cy+14}">${count}</text></g>`});
 return svg+'</svg>';
}
const species={
 Na:{name:'钠原子',symbol:'Na',z:11,layers:[2,8,1],charge:0},'Na+':{name:'钠离子',symbol:'Na',z:11,layers:[2,8],charge:1},
 Mg:{name:'镁原子',symbol:'Mg',z:12,layers:[2,8,2],charge:0},'Mg2+':{name:'镁离子',symbol:'Mg',z:12,layers:[2,8],charge:2},
 O:{name:'氧原子',symbol:'O',z:8,layers:[2,6],charge:0},'O2-':{name:'氧离子',symbol:'O',z:8,layers:[2,8],charge:-2},
 Cl:{name:'氯原子',symbol:'Cl',z:17,layers:[2,8,7],charge:0},'Cl-':{name:'氯离子',symbol:'Cl',z:17,layers:[2,8,8],charge:-1},
 Ne:{name:'氖原子',symbol:'Ne',z:10,layers:[2,8],charge:0}
};
const symbol=k=>{const s=species[k],n=Math.abs(s.charge);return s.symbol+(n?`<sup>${n===1?'':n}${s.charge>0?'+':'−'}</sup>`:'')};
const structure=(k,options={})=>{const s=species[k];return diagram(s.z,s.layers,options)};
const formalNote='教材式结构示意图：弧线表示电子层，层上数字表示电子数；电子层不是固定运动轨道。';
const transferNote='电子转移过程模型：圆圈不是固定运动轨道，移动路径和逐个计数快照不代表真实反应机理。';
const processes={Mg:{to:'Mg2+',count:2,lose:true},Cl:{to:'Cl-',count:1,lose:false}};
function dot(x,y,shell,bound=true,transfer=false){return `<g class="electron ${transfer?'transfer':''}" data-shell="${shell}" data-bound="${bound}" transform="translate(${x} ${y})"><circle r="12"/><text y="-1">−</text></g>`}
function particlePositions(type,t){const p=processes[type],cx=225,cy=210,points=[]; for(let i=0;i<p.count;i++){const a=p.lose?(-Math.PI/4+i*Math.PI/2):7*Math.PI/4,outer=[cx+166*Math.cos(a),cy+166*Math.sin(a)],outside=[560,75+i*245],start=p.lose?outer:outside,end=p.lose?outside:outer,v=Math.max(0,Math.min(1,t-i)),u=v*v*(3-2*v),bound=p.lose?v===0:v===1;points.push({x:start[0]+(end[0]-start[0])*u,y:start[1]+(end[1]-start[1])*u-25*Math.sin(Math.PI*u),shell:bound?3:'transfer',bound})}return points;}
function particles(type,t){
 const s=species[type],p=processes[type],cx=225,cy=210,radii=[62,116,166];
 let svg=`<svg class="particle" viewBox="0 0 620 430" role="img" data-z="${s.z}" data-progress="${t}" aria-label="${s.name}${p.lose?'失去':'得到'}${p.count}个电子的过程模型，原子核保持+${s.z}不变">`;
 s.layers.forEach((count,l)=>{if(!p.lose||l!==2||t<p.count)svg+=`<circle class="ring" cx="${cx}" cy="${cy}" r="${radii[l]}" data-layer="${l+1}"/>`;for(let i=0;i<count;i++){if(p.lose&&l===2)continue;let a=l===0?-Math.PI/2+i*Math.PI:i*Math.PI/4;svg+=dot(cx+radii[l]*Math.cos(a),cy+radii[l]*Math.sin(a),l+1)}});
 svg+=`<circle class="nucleus" cx="${cx}" cy="${cy}" r="31"/><text class="nucleus-label" x="${cx}" y="${cy+10}">+${s.z}</text>`;
 for(const e of particlePositions(type,t))svg+=dot(e.x,e.y,e.shell,e.bound,true);
 return svg+`<text x="446" y="370" font-size="24" fill="#a04c14">${p.lose?'移出的电子':'外来电子'}</text><text x="446" y="404" font-size="21" fill="#526972">路径仅为示意</text></svg>`;
}
function transferPage(type){
 const s=species[type],p=processes[type],t=q(),done=t===p.count,moving=t%1!==0,n=Math.floor(t),electrons=s.z+(p.lose?-n:n);
 const caption=done?`形成 ${symbol(p.to)} · 原子核 +${s.z} 不变`:'电子转移过程 · 观察原子核';
 const text=done?(p.lose?'失去 2 个电子：12 − 10 = +2；空的第三层不再画出。':'得到 1 个电子：17 − 18 = −1；最外层变为 8 个。'):moving?'电子正在转移；质子数不变。':t===0?'先数质子与电子，再逐步播放。':'第 1 个电子已移出，核外暂计 11 个；继续播放第 2 个。';
 return split(visual(particles(type,t),caption),`<div class="mini-pair">${card('变化前 · '+symbol(type),structure(type))}${card('变化后'+(done?' · '+symbol(p.to):''),`<div class="${done?'':'pending'}">${structure(p.to)}</div>`)}</div><div class="counts"><div class="count">质子数<b>${s.z}（不变）</b></div><div class="count">核外电子数<b id="electron-count">${moving?'转移中':electrons}</b></div></div><div class="callout">${text}</div><p class="small" style="margin-top:10px">${p.lose?'逐个移出只用于计数，不表示真实反应步骤。':'橙色只是追踪标记，得到的是电子。'}</p>`,true);
}
function quiz(items,compact=false){return `<div class="quiz ${compact?'compact-quiz':''}">${items.map(([question,answer],i)=>`<div class="quiz-row"><div><h2>${i+1}. ${question}</h2><p id="answer-${i}" class="answer ${responses[page][i]?'':'pending'}">${answer}</p></div><button data-answer="${i}" aria-expanded="${responses[page][i]}" aria-controls="answer-${i}">${responses[page][i]?'收起答案':'揭示答案'}</button></div>`).join('')}</div>`}
function lattice(){
 let svg='<svg class="lattice" viewBox="0 0 600 430" role="img" aria-label="固态氯化钠离子排列的二维截面局部示意，钠离子与氯离子交替排列，实际晶体向三维延伸">';
 for(let r=0;r<4;r++)for(let c=0;c<6;c++){const na=(r+c)%2===0,x=90+c*84,y=85+r*84;svg+=`<g data-ion="${na?'Na+':'Cl-'}"><circle cx="${x}" cy="${y}" r="${na?27:35}" fill="${na?'#edf7f5':'#fff4e9'}" stroke="${na?'#096f70':'#a04c14'}" stroke-width="2"/><text x="${x}" y="${y+7}" text-anchor="middle" font-size="24" fill="${na?'#096f70':'#a04c14'}">${na?'Na':'Cl'}<tspan baseline-shift="super" font-size="16">${na?'+':'−'}</tspan></text></g>`}
 for(let y of [85,169,253,337])svg+=`<text x="23" y="${y+5}" font-size="26" fill="#526972">…</text><text x="557" y="${y+5}" font-size="26" fill="#526972">…</text>`;
 for(let x of [90,174,258,342,426,510])svg+=`<text x="${x}" y="28" text-anchor="middle" font-size="25" fill="#526972">⋮</text><text x="${x}" y="414" text-anchor="middle" font-size="25" fill="#526972">⋮</text>`;
 return svg+'</svg>';
}
const lessons=[
{section:'2.1 从原子到离子',title:'原子得失电子后，还一定不显电性吗？',question:'只复习一个前提：电子得失时，原子核是否改变？',steps:1,note:formalNote,teacher:'用一次回顾衔接第一章：中性原子的质子数等于电子数；得失电子不改变质子数。不重讲稳定结构、得失倾向或分层计数，随后进入离子电荷的解释。',render:()=>`<div class="cards two">${card('钠原子 Na',structure('Na')+'<p class="center">电子排布 2、8、1</p>')}${card('氧原子 O',structure('O')+'<p class="center">电子排布 2、6</p>')}</div><div class="recap">${rev(1,'<p>中性原子：<b>质子数 = 电子数</b>；得失电子时，<b class="orange">质子数不变</b>。<br>接下来比较正、负电荷是否仍然等量。</p>')}</div>`},
{section:'2.1 从原子到离子',title:'怎样的微粒叫离子？',question:'失去负电荷、增加负电荷，分别会得到什么结果？',steps:3,teacher:'先揭示两条因果关系，再给定义。带电的原子或原子团叫离子；原子团的例子稍后认识。这里只讨论原子得失电子，不能说原子失电子就失质子。',render:()=>`<div class="cards two">${card('原子失去电子',rev(1,'<p class="big teal">阳离子</p><p>正电荷多于负电荷，<b>带正电</b>。'))}${card('原子得到电子',rev(2,'<p class="big orange">阴离子</p><p>负电荷多于正电荷，<b>带负电</b>。'))}</div>${call(3,'<b>带电的原子或原子团叫离子。</b><br>按所带电荷分为：阳离子和阴离子。')}`},
{section:'2.2 阳离子的形成',title:'镁失去两个电子时，哪些数量改变？',question:'每次移出一个最外层电子：盯住原子核，并数剩下的电子。',steps:2,animation:'Mg',note:transferNote,teacher:'Mg初态12质子12电子、2、8、2；先移出一个作为计数快照，再移出第二个，终态12质子10电子、2、8、Mg²⁺。全程核不变。终态不画空第三层。中间快照不代表真实反应机理。',render:()=>transferPage('Mg')},
{section:'2.2 阳离子的形成',title:'为什么写 Mg²⁺，而钠只写 Na⁺？',question:'比较失去的电子数与剩余的净电荷。',steps:3,note:formalNote,teacher:'从中性原子出发失去几个电子，就带几个单位正电荷。Mg：12−10=+2；Na：11−10=+1。强调净电荷，不是质子数减少。Na仅作对比，不重复第一章动画。',render:()=>`<div class="cards two">${card('镁：失去 2 个电子',structure('Mg2+')+rev(1,'<p class="center">12 − 10 = +2 → <b>Mg<sup>2+</sup></b></p>'))}${card('钠：失去 1 个电子',structure('Na+')+rev(2,'<p class="center">11 − 10 = +1 → <b>Na<sup>+</sup></b></p>'))}</div>${call(3,'中性原子<b>失去几个电子，就带几个单位正电荷</b>。<br>最外层电子全部失去后，正式结构图<b>不再画该空层</b>。')}`},
{section:'2.3 阴离子的形成',title:'氯得到一个电子后，为什么成为 Cl⁻？',question:'原有 17 个电子，再进入的这个粒子是什么？',steps:1,animation:'Cl',note:transferNote,teacher:'Cl初态17质子17电子、2、8、7。得到1电子后，17质子18电子、2、8、8；核不变，形成Cl⁻。动画只是电子转移示意，不表示自由氯原子构成真实反应的完整路径。',render:()=>transferPage('Cl')},
{section:'2.3 阴离子的形成',title:'Cl⁻ 与 O²⁻，负电荷数为什么不同？',question:'看得到几个电子，再比较质子数与电子总数。',steps:3,note:formalNote,teacher:'Cl得1电子，17−18=−1；O得2电子，8−10=−2。这里用结构对比复习氧，不重做详细得电子动画。O²⁻的2不是质子数、总电子数或离子个数。',render:()=>`<div class="cards two">${card('氯：得到 1 个电子',structure('Cl-')+rev(1,'<p class="center">17 − 18 = −1 → <b>Cl<sup>−</sup></b></p>'))}${card('氧：得到 2 个电子',structure('O2-')+rev(2,'<p class="center">8 − 10 = −2 → <b>O<sup>2−</sup></b></p>'))}</div>${call(3,'中性原子<b>得到几个电子，就带几个单位负电荷</b>。<br>电荷数看正、负电荷的差，不等于电子总数。')}`},
{section:'2.4 用数量判断微粒',title:'只知道质子数和电子数，怎样判断？',question:'先比较大小，再用“质子数 − 电子数”求净电荷。',steps:3,teacher:'明确适用范围：本页与下一页只判断单原子微粒。等于为中性原子，大于为阳离子，小于为阴离子。差值带符号，表示以元电荷为单位的净电荷。',render:()=>`<table class="table"><thead><tr><th>数量关系</th><th>微粒种类</th><th>电性</th></tr></thead><tbody>${[['质子数 = 电子数','中性原子','不显电性'],['质子数 > 电子数','阳离子','带正电'],['质子数 < 电子数','阴离子','带负电']].map(([a,b,c],i)=>`<tr><td>${a}</td><td>${rev(i+1,b)}</td><td>${rev(i+1,c)}</td></tr>`).join('')}</tbody></table><div class="callout">判断范围：<b>单原子微粒</b>。<br>净电荷（以单位电荷计）= 质子数 − 核外电子数。</div>`},
{section:'2.4 用数量判断微粒',title:'这四个微粒，你能判对吗？',question:'先说原子或离子，再说名称、符号与判断依据。',steps:4,quiz:true,teacher:'四个例子均为单原子微粒。先通过质子数确定元素，再用质子数与电子数的差判断种类和电荷。每行可独立揭示或收起；底部按顺序揭示。',render:()=>quiz([['12 个质子、10 个电子','Mg²⁺：阳离子；12 > 10，净电荷为 +2。'],['8 个质子、10 个电子','O²⁻：阴离子；8 < 10，净电荷为 −2。'],['17 个质子、18 个电子','Cl⁻：阴离子；17 < 18，净电荷为 −1。'],['10 个质子、10 个电子','Ne：中性原子；10 = 10，整体不显电性。']],true)},
{section:'2.5 离子符号的书写',title:'怎样一步一步写出 2Mg²⁺？',question:'元素符号、右上角电荷、前面的系数，各在什么位置？',steps:4,teacher:'按Mg、右上角数字2、右上角+、前面系数2依次标注。前两步是书写过程，尚不是完整离子符号；第三步完成Mg²⁺，第四步表示两个镁离子。右上角2+是每个离子的电荷。',render:()=>split(visual(`<div class="symbol-build" aria-label="离子符号逐步书写"><span data-part="coefficient" class="coefficient ${q()>=4?'':'pending'}">2</span><span data-part="element" class="${q()>=1?'':'pending'}">Mg</span><sup><span data-part="magnitude" class="${q()>=2?'':'pending'}">2</span><span data-part="sign" class="${q()>=3?'':'pending'}">+</span></sup></div><p class="small">${q()<3?'书写过程：逐步补全符号':q()===3?'一个镁离子：Mg²⁺':'两个镁离子：2Mg²⁺'}</p>`),facts(['先写元素符号 <b>Mg</b>。','右上角写电荷数 <b>2</b>。','数字后写正负号：<b>Mg<sup>2+</sup></b>。','前面加系数 <b>2</b>：表示<b>两个镁离子</b>。']))},
{section:'2.5 离子符号的书写',title:'右上角的电荷，怎样写才规范？',question:'读出这四个符号：每个离子带几个单位、哪一种电荷？',steps:3,teacher:'右上角、数字在前正负号在后、1省略。Na⁺与Cl⁻表示一个单位电荷，不能写Na¹⁺或把电荷写成下标。这里只教离子符号，不涉及化合价标在正上方的写法。',render:()=>`<div class="cards four symbols">${['Na+','Mg2+','O2-','Cl-'].map(k=>card(species[k].name,`<p class="big">${symbol(k)}</p>`)).join('')}</div>${call(1,'电荷标在元素符号的<b class="teal">右上角</b>。')}${call(2,'数字在前，正负号在后：<b>Mg<sup>2+</sup>、O<sup>2−</sup></b>。')}${call(3,'带一个单位电荷时<b>省略数字 1</b>：<b>Na<sup>+</sup>、Cl<sup>−</sup></b>。')}`},
{section:'2.5 离子符号的书写',title:'前面的“2”和右上角的“2”，相同吗？',question:'比较 Mg²⁺ / 2Mg²⁺ 与 O²⁻ / 2O²⁻。',steps:3,teacher:'系数表示离子个数，右上角电荷是每个离子的电荷。一个Mg²⁺带2正电、两个Mg²⁺各带2正电；氧同理。别把系数和上标相乘后改写成一个4价离子。',render:()=>`<div class="cards two coefficient-cards">${[['Mg2+',1],['Mg2+',2],['O2-',1],['O2-',2]].map(([k,n],i)=>card(`<span class="formula">${n===2?'<span class="orange">2</span>':''}${symbol(k)}</span>`,rev(i<2?1:2,`<p><b>${n===1?'一':'两'}个${species[k].name}</b><br>每个带 2 个单位${species[k].charge>0?'正':'负'}电荷。</p>`))).join('')}</div>${call(3,'<b>前面的系数 → 离子个数；右上角的数字和符号 → 每个离子的电荷。</b>')}`},
{section:'2.5 认识原子团离子',title:'几个原子组成的整体，也能带电吗？',question:'依次认识这五种常见原子团离子，读出它们所带的电荷。',steps:5,teacher:'只认识名称与符号，不展开原子团化合价规律。下标如SO₄中的4表示一个该离子中氧原子的个数，上标2−是整个硫酸根离子电荷。NH₄⁺是阳离子，其余四个为阴离子。',render:()=>`<table class="table group-table"><thead><tr><th>名称</th><th>离子符号</th><th>整个原子团所带的电荷</th></tr></thead><tbody>${[['氢氧根离子','OH<sup>−</sup>','1 个单位负电荷'],['硝酸根离子','NO<sub>3</sub><sup>−</sup>','1 个单位负电荷'],['硫酸根离子','SO<sub>4</sub><sup>2−</sup>','2 个单位负电荷'],['碳酸根离子','CO<sub>3</sub><sup>2−</sup>','2 个单位负电荷'],['铵根离子','NH<sub>4</sub><sup>+</sup>','1 个单位正电荷']].map(([n,s,c],i)=>`<tr><td>${n}</td><td>${rev(i+1,`<b>${s}</b>`)}</td><td>${rev(i+1,c)}</td></tr>`).join('')}</tbody></table><p class="small" style="margin-top:16px">上标表示整个原子团的电荷；原子团的化合价规律留到第四章。</p>`},
{section:'2.6 结构示意图的判断',title:'只给这张结构图，你能读出什么？',question:'按“核电荷 → 总电子数 → 层数 → 最外层 → 微粒种类”读图。',steps:5,note:formalNote,teacher:'本图为Mg²⁺但先不显示名称。核+12；电子2+8=10；2层；最外层8；12>10为阳离子，Mg²⁺。规范图无空第三层。提醒层数与电子总数不是同一概念。',render:()=>split(visual(structure('Mg2+',{nucleus:q()===1,highlight:q()===4?1:-1}),q()>=5?'镁离子 Mg²⁺':'先读图，再判断'),facts(['核电荷数 <b>12</b>，质子数为 12。','核外电子总数：<b>2 + 8 = 10</b>。','占有电子的电子层：<b>2 层</b>。','最外层电子数：<b>8</b>。','12 > 10：<b class="teal">阳离子 Mg<sup>2+</sup></b>。']))},
{section:'2.6 相同电子排布的比较',title:'都是 2、8，为什么不是同一种微粒？',question:'先看电子排布，再比较原子核中的质子数。',steps:3,note:formalNote,teacher:'Na⁺、Mg²⁺、O²⁻、Ne都有10电子，质子数依次11、12、8、10。电子排布相同不表示同一种元素；元素由质子数决定。Ne是原子而不是离子。',render:()=>`<div class="cards four compare">${['Na+','Mg2+','O2-','Ne'].map(k=>card(symbol(k),structure(k,{nucleus:q()>=2})+rev(1,'<p class="center">2、8 · 10 个电子</p>')+rev(2,`<p class="center">质子数 <b>${species[k].z}</b></p>`))).join('')}</div>${call(3,'电子排布相同，不代表属于同一种元素。<br><b>元素种类由质子数决定。</b>')}`},
{section:'2.7 离子构成物质',title:'氯化钠为什么不是由 NaCl 分子构成？',question:'观察相邻离子的排列：能圈出一个独立的“NaCl 分子”吗？',steps:4,note:'二维截面局部示意：实际氯化钠晶体向三维延伸；图示不表示离子真实大小比例，也不表示独立分子。',teacher:'固态NaCl由Na⁺和Cl⁻构成，正负离子间存在静电作用。异号相吸，同号相斥，整体形成有序三维排列。二维局部示意不能用来数实际三维配位数。Na⁺:Cl⁻=1:1，正负电荷等量抵消，NaCl为组成比，不是独立分子。',render:()=>split(visual(lattice(),'固态氯化钠 · 局部离子排列'),facts(['固态氯化钠由 <b>Na<sup>+</sup> 和 Cl<sup>−</sup></b> 构成。','正、负离子之间存在<b>静电作用</b>；异号相吸。','Na<sup>+</sup> : Cl<sup>−</sup> = <b>1 : 1</b>，正负电荷抵消，整体不显电性。','<b>NaCl 表示组成比例</b>，不表示一个独立的 NaCl 分子。']))},
{section:'2.8 综合应用与易错辨析',title:'形成离子后，元素和电子数怎样变？',question:'先判断并说依据，再点击揭示简短解析。',steps:3,quiz:true,teacher:'将形成离子的过程与元素定义联系起来。Na和Na⁺质子数都是11；Mg²⁺有12−2=10电子；O²⁻有8质子10电子，负电荷多2个单位。',render:()=>quiz([['Na⁺ 与 Na 是否属于同一种元素？','是。质子数都为 11，都是钠元素；电子数不同。'],['Mg²⁺ 的核外电子数是多少？','10 个。镁原子有 12 个电子，失去 2 个后剩 10 个。'],['O²⁻ 为什么带两个单位负电荷？','8 个质子、10 个电子，负电荷比正电荷多 2 个单位。']])},
{section:'2.8 综合应用与易错辨析',title:'符号、微粒和物质，你分清了吗？',question:'用最后三个问题，区分电子排布、离子个数与物质构成。',steps:3,quiz:true,teacher:'电子数相同不代表核相同；2Cl⁻表示两个氯离子，每个带1个单位负电荷；固态NaCl由离子构成不是分子。第二章到此结束，不自动开始第三章。',render:()=>quiz([['Na⁺、Mg²⁺、O²⁻、Ne 都有 10 个电子，为何不同？','质子数分别为 11、12、8、10；原子核不同，元素种类不同。'],['2Cl⁻ 中，前面的数字 2 表示什么？','两个氯离子；每个氯离子带 1 个单位负电荷。'],['固态氯化钠由分子还是离子构成？','由 Na⁺ 和 Cl⁻ 构成；NaCl 表示两种离子的组成比为 1∶1。']])}
];
const state=Array(lessons.length).fill(0),responses=Object.fromEntries(lessons.flatMap((l,i)=>l.quiz?[[i,Array(l.steps).fill(false)]]:[]));
function render(){
 const lesson=lessons[page];ClassroomDOM.text($('#section'),`第二章 / ${lesson.section}`);ClassroomDOM.text($('#title'),lesson.title);ClassroomDOM.text($('#question'),lesson.question);
 ClassroomDOM.html($('#content'),`<section class="page" data-page="${page+1}">${lesson.render()}</section>`);ClassroomDOM.text($('#model-note'),lesson.note||'课堂约定：先观察、再解释；点击揭示结论，可随时回退或查看讲解提示。');sync();
}
let lastSync='';
function sync(){
 const signature=[page,Math.floor(q()),playing].join(':');if(playing&&signature===lastSync)return;lastSync=signature;
 const lesson=lessons[page],n=lessons[page].quiz?responses[page].filter(Boolean).length:q();
 $('#back').disabled=n===0&&!playing;$('#step').disabled=n>=lesson.steps||playing;$('#step').textContent=lesson.animation?'逐步播放':lessons[page].quiz?'揭示下一题':'逐步揭示';
 $('#play').hidden=!lesson.animation;$('#play').disabled=n===lesson.steps&&!playing;$('#play').textContent=playing?'暂停':'连续播放';
 $('#prev').disabled=page===0;$('#next').disabled=page===lessons.length-1;ClassroomDOM.text($('#page-count'),`${String(page+1).padStart(2,'0')} / ${lessons.length}`);ClassroomDOM.text($('#step-count'),`${Math.floor(n)} / ${lesson.steps}`);$('#progress').style.width=(page+1)/lessons.length*100+'%';
}
function pause(){playing=false;cancelAnimationFrame(raf);sync()}
function animate(to){target=to;playing=true;last=performance.now();sync();function frame(now){state[page]=Math.min(target,q()+Math.max(0,Math.min(now-last,100))/2000);last=now;if(q()===target)playing=false;render();if(playing)raf=requestAnimationFrame(frame)}raf=requestAnimationFrame(frame)}
function step(){if(lessons[page].animation){if(!playing&&q()<lessons[page].steps)animate(Math.min(lessons[page].steps,Math.floor(q())+1))}else if(lessons[page].quiz){let i=responses[page].indexOf(false);if(i>=0)responses[page][i]=true;render()}else{state[page]=Math.min(lessons[page].steps,q()+1);render()}}
function back(){pause();if(lessons[page].quiz){let i=responses[page].lastIndexOf(true);if(i>=0)responses[page][i]=false}else state[page]=Math.max(0,Math.ceil(q())-1);render()}
function reset(){pause();state[page]=0;if(lessons[page].quiz)responses[page].fill(false);render()}
function go(n){pause();page=Math.max(0,Math.min(lessons.length-1,n));render()}
function closePanel(){if($('#panel').open)$('#panel').close();$('#toc').setAttribute('aria-expanded','false');returnFocus?.focus()}
function openPanel(kind){
 pause();returnFocus=document.activeElement;$('#panel').classList.toggle('toc-panel',kind==='toc');$('#toc').setAttribute('aria-expanded',String(kind==='toc'));$('#panel-title').textContent=kind==='toc'?'第二章 · 课堂目录':`讲解提示 · 第 ${page+1} 页`;
 $('#panel-content').innerHTML=kind==='toc'?`<div class="toc-grid">${lessons.map((l,i)=>`<button data-go="${i}" ${i===page?'aria-current="page"':''}>${String(i+1).padStart(2,'0')}　${l.title}</button>`).join('')}</div>`:`<p>${lessons[page].teacher}</p><div class="callout">操作：← → 翻页 · 空格分步 / 动画暂停 · R 复位 · N 提示 · F 全屏</div>`;
 $('#panel').showModal();$('#close-panel').focus();if(kind==='toc')$('#panel-content [aria-current=page]').scrollIntoView({block:'nearest'});
}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('#status').textContent='浏览器未允许全屏，可通过浏览器菜单或 F11 进入。';$('#status').hidden=false}}
$('#step').onclick=step;$('#back').onclick=back;$('#reset').onclick=reset;$('#play').onclick=()=>playing?pause():q()<lessons[page].steps&&animate(lessons[page].steps);
$('#prev').onclick=()=>go(page-1);$('#next').onclick=()=>go(page+1);$('#fullscreen').onclick=fullscreen;$('#notes').onclick=()=>openPanel('notes');$('#toc').onclick=()=>openPanel('toc');$('#close-panel').onclick=closePanel;
$('#panel').addEventListener('cancel',e=>{e.preventDefault();closePanel()});
$('#panel').addEventListener('click',e=>{if(e.target!==e.currentTarget||!e.currentTarget.classList.contains('toc-panel'))return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePanel()});$('#panel-content').onclick=e=>{let b=e.target.closest('[data-go]');if(b){closePanel();go(+b.dataset.go)}};
$('#content').onclick=e=>{let b=e.target.closest('[data-answer]');if(b){let i=+b.dataset.answer;responses[page][i]=!responses[page][i];render();$(`[data-answer="${i}"]`).focus()}};
document.addEventListener('fullscreenchange',()=>{$('#fullscreen').textContent=document.fullscreenElement?'退出全屏 F':'全屏 F';$('#status').hidden=true});
document.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||e.repeat)return;
 if($('#panel').open){if(e.key.toLowerCase()==='n'||e.key==='Escape'){e.preventDefault();closePanel()}return}
 if(!['ArrowLeft','ArrowRight','PageUp','PageDown','Home','End',' ','f','F','r','R','n','N'].includes(e.key))return;
 if(e.key===' '&&e.target.closest('button'))return;e.preventDefault();
 if(['ArrowRight','PageDown'].includes(e.key))go(page+1);else if(['ArrowLeft','PageUp'].includes(e.key))go(page-1);else if(e.key==='Home')go(0);else if(e.key==='End')go(lessons.length-1);else if(e.key.toLowerCase()==='f')fullscreen();else if(e.key.toLowerCase()==='r')reset();else if(e.key.toLowerCase()==='n')openPanel('notes');else if(lessons[page].animation&&playing)pause();else step();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause()});
function fit(){const scale=Math.min(innerWidth/1600,innerHeight/900),el=$('#stage');el.style.transform=`scale(${scale})`;el.style.left=(innerWidth-1600*scale)/2+'px';el.style.top=(innerHeight-900*scale)/2+'px'}
addEventListener('resize',fit);fit();render();
