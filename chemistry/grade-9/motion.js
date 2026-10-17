'use strict';
// Reuse the original coordinate functions; render text only at teaching-stage boundaries.
(()=>{
 const attr=(e,k,v)=>{if(e&&e.getAttribute(k)!==String(v))e.setAttribute(k,v);};
 function motion(type,t,nodes){
  if(['Na','O','Mg','Cl','oxygen'].includes(type)){
   const name=type==='oxygen'?'O':type;
   particlePositions(name,t).forEach((v,i)=>{const e=nodes.electrons[i];attr(e,'transform',`translate(${v.x} ${v.y})`);attr(e,'data-bound',v.bound);attr(e,'data-shell',v.shell);});
   if(nodes.particle?.hasAttribute('data-progress'))attr(nodes.particle,'data-progress',t);
  }else if(type==='electrolysis'||type==='comparison'){
   const time=type==='comparison'?t*1.5:t,pos=reactionPositions(time);
   nodes.atoms.forEach(e=>{const i=Number(e.dataset.id.split('-')[1]);attr(e,'transform',`translate(${pos[i][0]} ${pos[i][1]})`);});
   const pairs=[[0,1],[0,2],[3,4],[3,5],[1,2],[4,5],[0,3]];
   nodes.links.forEach((e,i)=>{const [a,b]=pairs[i];for(const [k,v]of Object.entries({x1:pos[a][0],y1:pos[a][1],x2:pos[b][0],y2:pos[b][1],opacity:i<4?1-ease(time-1):ease(time-2)}))attr(e,k,v);});attr(nodes.reaction,'data-progress',time);
   if(type==='comparison'){const u=ease(t/2);nodes.water.forEach((e,i)=>attr(e,'transform',`translate(${i?345+115*u:235-115*u} ${i?230-25*u:230-135*u}) scale(1)`));}
  }else if(type==='formula'){
   const indexes={};nodes.balance.forEach(e=>{const symbol=e.dataset.balanceGroup,i=indexes[symbol]||0;indexes[symbol]=i+1;const v=Number(e.dataset.value),u=t<2?0:i===0?1:smooth(t-2),w=Math.abs(v)*42;attr(e,'opacity',u);attr(e,'transform',`translate(${120+i*(w+12)+(1-u)*35} ${v>0?14:99})`);});
  }else if(type==='bracket'){
   const u=smooth(t-1),expanded=smooth(t-2);nodes.bracket.forEach(e=>e.style.opacity=u);nodes.groups.forEach((e,i)=>{attr(e,'transform',`translate(${210+i*250} ${25+(1-expanded)*45})`);attr(e,'opacity',t<1?0:i===0?1:expanded);});
  }
 }
 function refs(){const c=document.querySelector('#content');return {electrons:[...c.querySelectorAll('.particle .electron.transfer')],particle:c.querySelector('.particle'),atoms:[...c.querySelectorAll('.electrolysis [data-id]')],links:[...c.querySelectorAll('.electrolysis .model-link')],reaction:c.querySelector('.electrolysis'),water:[...c.querySelectorAll('.motion-cards .card:first-child .molecule')],balance:[...c.querySelectorAll('[data-balance-group]')],groups:[...c.querySelectorAll('[data-count-group]')],bracket:[...c.querySelectorAll('.bracket-stage .formula-large [style]')]};}
 animate=function(to){cancelAnimationFrame(raf);target=to;playing=true;last=performance.now();sync();let key='',nodes=refs();const type=lessons[page].animation;
  function frame(now){state[page]=Math.min(target,q()+Math.max(0,Math.min(now-last,100))/2000);last=now;const t=q(),reactionTime=type==='comparison'?t*1.5:t,newKey=[Math.floor(t),Number.isInteger(t),reactionTime<=1,reactionTime<=1.05,reactionTime>=3].join(':');
   if(newKey!==key){render();nodes=refs();key=newKey;}motion(type,t,nodes);
   if(t===target){playing=false;sync();}else raf=requestAnimationFrame(frame);
  }raf=requestAnimationFrame(frame);
 };
})();
