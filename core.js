'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const COL={blue:'#253A9F',pink:'#F024A2',lime:'#C4F445',cream:'#FCFAF4'};
const KINDS=['radial','four','five'];
const DEF_COL={radial:COL.pink,four:COL.blue,five:COL.lime};

function h(tag,props,...kids){
  const el=document.createElement(tag);
  for(const k in (props||{})){
    const v=props[k]; if(v==null||v===false) continue;
    if(k==='class') el.className=v;
    else if(k==='html') el.innerHTML=v;
    else if(k==='style'&&typeof v==='object'){ for(const s in v){ if(s.startsWith('--')) el.style.setProperty(s,v[s]); else el.style[s]=v[s]; } }
    else if(k.startsWith('on')) el.addEventListener(k.slice(2),v);
    else el.setAttribute(k,v===true?'':v);
  }
  for(const c of kids.flat(Infinity)){ if(c==null||c===false) continue; el.append(c.nodeType?c:document.createTextNode(c)); }
  return el;
}
function flowerSVG(kind,color,cls){
  const s=SHAPES[kind]; const vb=kind==='knot'?'-50 -25.05 100 50.1':'-50 -50 100 100';
  const col=color||DEF_COL[kind]||COL.blue; const st=(col===COL.lime||col===COL.cream)?` stroke="${COL.blue}" stroke-width="1.7" stroke-linejoin="round"`:'';
  return `<svg class="${cls||'flower'}" viewBox="${vb}" aria-hidden="true"><path d="${s.d}" fill="${col}"${st}/></svg>`;
}
const P2D={};
const path2d=k=>P2D[k]||(P2D[k]=new Path2D(k==='pouch'?SHAPES.pouch:SHAPES[k].d));

/* ===== swing engine: a damped pendulum; one loop drives everything that hangs, and it sleeps when nothing moves ===== */
const swingers=new Set(); let raf=0,lastT=0;
function swing(el,o={}){
  const s={el,a:o.a||0,v:0,w:o.w||2.4,z:o.z??0.16,max:o.max||44,idle:reduce?0:(o.idle||0),ph:rand(0,6.28),drag:false};
  s.kick=dv=>{ s.v+=reduce?dv*.35:dv; wake(); };
  swingers.add(s); wake(); return s;
}
function wake(){ if(!raf){ lastT=performance.now(); raf=requestAnimationFrame(tick); } }
function tick(t){
  raf=0; const dt=Math.min(.033,(t-lastT)/1000); lastT=t; let live=false;
  for(const s of swingers){
    if(!s.el.isConnected){ swingers.delete(s); continue; }
    if(s.drag){ live=true; continue; }
    let acc=-s.w*s.w*s.a-2*s.z*s.w*s.v;
    if(s.idle) acc+=s.idle*s.w*s.w*Math.sin((t/1000)*.9+s.ph);
    s.v+=acc*dt; s.a+=s.v*dt; s.a=clamp(s.a,-s.max,s.max);
    if(!s.idle&&Math.abs(s.a)<.03&&Math.abs(s.v)<.06){ s.a=0; s.v=0; s.el.style.transform=''; continue; }
    s.el.style.transform=`rotate(${s.a.toFixed(2)}deg)`; live=true;
  }
  if(live) raf=requestAnimationFrame(tick);
}
function hoverKick(slot,s,k=-1.25){
  slot.addEventListener('pointermove',e=>{ if(e.pointerType==='touch'||e.buttons) return; s.kick(clamp(e.movementX||0,-40,40)*k); });
}
/* grab, drag, let go: the object keeps swinging with the speed you gave it */
function dragSwing(slot,s){
  let d=null;
  const pv=()=>{ const r=slot.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top}; };
  slot.addEventListener('pointerdown',e=>{
    if(e.button>0) return;
    d={x:e.clientX,y:e.clientY,moved:false,lt:performance.now(),lv:0};
    try{ slot.setPointerCapture(e.pointerId); }catch(_){}
  });
  slot.addEventListener('pointermove',e=>{
    if(!d) return;
    if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>6){ d.moved=true; s.drag=true; slot.classList.add('is-drag'); }
    if(!d.moved) return;
    const p=pv(); const ang=-Math.atan2(e.clientX-p.x,Math.max(40,e.clientY-p.y))*180/Math.PI;
    const now=performance.now(), dt=Math.max(8,now-d.lt)/1000;
    d.lv=((ang-s.a)/dt)*.55+d.lv*.45; d.lt=now; s.a=clamp(ang,-s.max,s.max); s.v=d.lv;
    s.el.style.transform=`rotate(${s.a.toFixed(2)}deg)`;
  });
  const end=()=>{ if(!d) return; const was=d; d=null; slot.classList.remove('is-drag'); if(was.moved){ s.drag=false; s.v=clamp(s.v,-320,320); wake(); } };
  slot.addEventListener('pointerup',end);
  slot.addEventListener('pointercancel',()=>{ if(d){ d=null; s.drag=false; slot.classList.remove('is-drag'); wake(); } });
}

/* ===== dialog (used by Save image) ===== */
let lastFocus=null;
function openOverlay(node){ const ov=$('#overlay'); ov.replaceChildren(node); ov.classList.add('open'); lastFocus=document.activeElement; const x=$('.x',ov); if(x) x.focus(); }
function closeOverlay(){ const ov=$('#overlay'); ov.classList.remove('open'); ov.replaceChildren(); if(lastFocus&&lastFocus.focus) lastFocus.focus(); }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeOverlay(); });
$('#overlay').addEventListener('pointerdown',e=>{ if(e.target.id==='overlay') closeOverlay(); });

/* ===== router + top bar ===== */
const ROUTES={};
const NAV=[['explore','Explore'],['play','Play'],['stories','Stories']];
function currentRoute(){ const r=(location.hash||'#home').slice(1); return ROUTES[r]?r:'home'; }
function render(){
  const r=currentRoute(); const view=$('#view');
  $('#overlay').classList.remove('open'); $('#overlay').replaceChildren(); view.replaceChildren(); document.body.dataset.route=r;
  ROUTES[r](view);
  const section=STORIES.some(s=>s.id===r)?'stories':r;
  $$('.links a').forEach(a=>{ if(a.dataset.r===section) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  window.scrollTo(0,0); view.focus({preventScroll:true});
}
function buildNav(){
  $('#bar').replaceChildren(h('div',{class:'bar-in'},
    h('a',{class:'brand',href:'#home','aria-label':'Lucky Charms, home'},h('span',{html:flowerSVG('knot',COL.blue,'knot')}),'Lucky Charms'),
    h('nav',{class:'links','aria-label':'Main'},NAV.map(([r,l])=>h('a',{href:'#'+r,'data-r':r},l)))));
}
addEventListener('hashchange',render);
