/* ===== the pendant: one SVG used by the editor, the finished charm and the bag ===== */
let pendUid=0;
function stitchColour(ground){ return ground===COL.blue||ground===COL.pink?COL.cream:COL.blue; }
function pendantSVG({snap=null,cord=COL.cream,ground=COL.cream,anim=false}={}){
  const id='pc'+(++pendUid); const cx=167,cy=253.5,d=13,sx=(262-2*d)/262,sy=(432-2*d)/432;
  const strands=['M150 64 C146 -4 158 -70 167 -100','M185 64 C189 -4 176 -70 167 -100'];
  const strokes=(col,wd)=>strands.map(dd=>`<path ${anim?'class="cord-line anim" pathLength="1"':''} d="${dd}" fill="none" stroke="${col}" stroke-width="${wd}" stroke-linecap="round"/>`).join('');
  return `<svg viewBox="26 -100 282 580" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your charm">
    <defs><clipPath id="${id}"><path d="${SHAPES.pouch}"/></clipPath></defs>
    ${snap?`<image href="${snap}" x="36.02" y="37.5" width="262" height="432" clip-path="url(#${id})" preserveAspectRatio="none"/>`:''}
    <path d="${SHAPES.pouch}" fill="none" stroke="${COL.blue}" stroke-width="3.4" stroke-linejoin="round"/>
    <path d="${SHAPES.pouch}" transform="translate(${cx} ${cy}) scale(${sx} ${sy}) translate(${-cx} ${-cy})" fill="none" stroke="${stitchColour(ground)}" stroke-width="2.6" stroke-dasharray="7 5.5" stroke-linecap="round"/>
    ${strokes(COL.blue,9.5)}${strokes(cord,5.5)}
    <path d="${SHAPES.knotAbs}" fill="${cord}" stroke="${COL.blue}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="167" cy="-96" r="5.5" fill="${COL.lime}" stroke="${COL.blue}" stroke-width="2.4"/>
  </svg>`;
}

/* ===== the bag: tap to move your charm, drag it to swing it, walk to shake it ===== */
function bagStage({onPlace}={}){
  const z=h('div',{class:'zoom'},h('img',{class:'bg',src:A('bag'),alt:'A patterned white bag with a pink omamori and an acrylic keychain hanging from it'}));
  const st=h('div',{class:'carry-stage'},z); const hung=[];
  function hang(html,x,y,hPct){
    const pend=h('div',{class:'pend',style:{left:(x*100)+'%',top:(y*100)+'%',height:hPct+'%',aspectRatio:'282/580',transform:'translateX(-50%)'}});
    const sw=h('div',{class:'swing',html}); pend.append(sw); z.append(pend);
    const s=swing(sw,{w:2.5,z:.12,max:50}); dragSwing(pend,s); s.kick(rand(40,70)*(Math.random()<.5?-1:1));
    const rec={pend,s}; hung.push(rec); return rec;
  }
  let down=null;
  st.addEventListener('pointerdown',e=>{ down={x:e.clientX,y:e.clientY,onPend:!!e.target.closest('.pend')}; });
  st.addEventListener('pointerup',e=>{
    if(!down||down.onPend||Math.hypot(e.clientX-down.x,e.clientY-down.y)>8) return;
    const r=z.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    if(onPlace&&x>=0&&x<=1&&y>=0&&y<=1) onPlace(x,y);
  });
  st.hang=hang;
  st.walk=()=>{ let i=0; const t=setInterval(()=>{ hung.forEach(r=>r.s.kick((i%2?-1:1)*rand(45,80))); if(++i>=7) clearInterval(t); },420); };
  return st;
}

/* ===== PNG of a finished charm (downloads are blocked in the published page, so it is shown in a dialog) ===== */
function pendantPNG(svgString,done){
  const W=1128,Hh=2320; const img=new Image();
  img.onload=()=>{ const c=document.createElement('canvas'); c.width=W; c.height=Hh; const x=c.getContext('2d'); x.fillStyle=COL.cream; x.fillRect(0,0,W,Hh); x.drawImage(img,0,0,W,Hh); try{ done(c.toDataURL('image/png')); }catch(e){ done(null); } };
  img.onerror=()=>done(null);
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgString.replace('<svg ','<svg width="1128" height="2320" '));
}
