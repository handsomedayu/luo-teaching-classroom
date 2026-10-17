'use strict';
// Preserve mounted SVG and focused controls; only changed attributes/text reach the DOM.
window.ClassroomDOM=(()=>{
 const cache=new WeakMap(),template=document.createElement('template');
 function patch(a,b){
  if(a.nodeType!==b.nodeType||a.nodeName!==b.nodeName){a.replaceWith(b.cloneNode(true));return;}
  if(a.nodeType===3){if(a.data!==b.data)a.data=b.data;return;}
  if(a.nodeType!==1)return;
  for(const x of Array.from(a.attributes))if(!b.hasAttribute(x.name))a.removeAttribute(x.name);
  for(const x of b.attributes)if(a.getAttribute(x.name)!==x.value)a.setAttribute(x.name,x.value);
  children(a,b);
  if((a.tagName==='INPUT'||a.tagName==='SELECT')&&a.value!==b.value)a.value=b.value;
 }
 function children(a,b){const old=Array.from(a.childNodes),next=Array.from(b.childNodes);for(let i=0;i<Math.max(old.length,next.length);i++){if(!next[i])old[i].remove();else if(!old[i])a.append(next[i].cloneNode(true));else patch(old[i],next[i]);}}
 function html(el,text){if(cache.get(el)===text)return;template.innerHTML=text;children(el,template.content);cache.set(el,text);}
 function text(el,value){value=String(value);if(el.textContent!==value)el.textContent=value;}
 return {html,text};
})();
