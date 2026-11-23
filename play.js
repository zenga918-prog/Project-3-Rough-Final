/* ===== PLAY: stamp, brush and repeat flowers on a pouch, tie on a cord, finish it, swing it, carry it ===== */
ROUTES.play=view=>{
  const S=3,PX=36.02,PY=37.5,PW=262,PH=432;
  const PS={tool:'stamp',kind:'radial',color:COL.pink,size:64,tilt:true,ground:COL.cream,cord:COL.cream,gap:14,pattern:false,pOff:0,ops:[],gid:0,finished:false,snap:null};
  const COLS=[COL.pink,COL.blue,COL.lime,COL.cream];
  const cv=h('canvas',{class:'play-canvas',width:PW*S,height:PH*S,role:'img','aria-label':'Drawing area. Tap or drag to place flowers on the pouch.'});
  const ctx=cv.getContext('2d'); const sc=document.createElement('canvas').getContext('2d');
  const inPouch=(x,y)=>sc.isPointInPath(path2d('pouch'),x,y);
  const colFor=()=>PS.color==='mix'?pick(COLS.filter(c=>c!==PS.ground)):PS.color;

  function drawOp(c,op){
    c.save(); c.translate(op.x,op.y); c.rotate(op.rot); const k=op.s/100; c.scale(k,k);
    const p=path2d(op.kind); c.fillStyle=op.col; c.fill(p);
    const edge=(op.col===COL.lime||op.col===COL.cream)?COL.blue:(op.col===PS.ground?COL.cream:null);
    if(edge){ c.lineWidth=1.8/k; c.strokeStyle=edge; c.lineJoin='round'; c.stroke(p); }
    c.restore();
  }
  function base(){ ctx.setTransform(S,0,0,S,-PX*S,-PY*S); ctx.save(); ctx.clip(path2d('pouch')); }
  function redraw(){
    ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height); base();
    ctx.fillStyle=PS.ground; ctx.fillRect(PX-2,PY-2,PW+4,PH+4);
    if(PS.pattern){
      const sz=clamp(PS.size,28,96),p=sz+PS.gap,n=Math.ceil(PW/p)+3; const cx=PX+PW/2,cy=PY+PH/2;
      for(let r=0;r<n+2;r++) for(let c=0;c<n;c++){
        const k=KINDS[(c+r+PS.pOff)%3]; let col=DEF_COL[k]; if(col===PS.ground) col=COL.cream;
        drawOp(ctx,{kind:k,col,s:sz,rot:0,x:cx+(c-(n-1)/2)*p,y:cy+(r-(n+1)/2)*p});
      }
    }
    PS.ops.forEach(o=>drawOp(ctx,o)); ctx.restore();
  }
  function addOp(x,y,g,jit){
    const op={kind:PS.kind,col:colFor(),s:PS.size*(jit?rand(.82,1.12):1),rot:PS.tilt?rand(0,6.283):0,x,y,g}; PS.ops.push(op);
    base(); drawOp(ctx,op); ctx.restore(); return op;
  }
  const toUnits=e=>{ const r=cv.getBoundingClientRect(); return {x:PX+(e.clientX-r.left)/r.width*PW,y:PY+(e.clientY-r.top)/r.height*PH}; };

  /* ---- the stage ---- */
  const overlay=h('div',{class:'play-overlay'});
  const ghost=h('div',{class:'play-overlay','aria-hidden':'true'}); ghost.innerHTML='<svg viewBox="26 -100 282 580"><path id="gp" fill="#F024A2" opacity=".42"/></svg>';
  const sw=h('div',{class:'swing'},cv,overlay,ghost);
  const stage=h('div',{class:'play-stage'},sw);
  const sidx=swing(sw,{w:2.2,z:.1,max:30});
  const bagHost=h('div',{style:{display:'none'}});
  const wrap=h('div',{class:'stage-wrap'},stage,bagHost);
  function renderOverlay(anim){ overlay.innerHTML=pendantSVG({snap:PS.finished?PS.snap:null,cord:PS.cord,ground:PS.ground,anim:!!anim}); }
  function setGhost(x,y){
    const g=$('#gp',ghost); if(!g) return;
    if(PS.finished||PS.tool==='repeat'||x==null){ g.setAttribute('d',''); return; }
    const col=PS.color==='mix'?COL.pink:PS.color; g.setAttribute('d',SHAPES[PS.kind].d); g.setAttribute('fill',col);
    g.setAttribute('transform',`translate(${x} ${y}) scale(${PS.size/100})`);
  }
  let lastP=null,gid=0,drawing=false;
  cv.addEventListener('pointerdown',e=>{
    if(PS.finished) return;
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    const p=toUnits(e);
    if(PS.tool==='repeat'){ PS.pOff=(PS.pOff+1)%3; PS.pattern=true; redraw(); return; }
    drawing=true; gid=++PS.gid; lastP=p; addOp(p.x,p.y,gid,PS.tool==='brush');
  });
  cv.addEventListener('pointermove',e=>{
    const p=toUnits(e);
    if(drawing&&PS.tool==='brush'){ if(Math.hypot(p.x-lastP.x,p.y-lastP.y)>PS.size*.5){ addOp(p.x,p.y,gid,true); lastP=p; } }
    if(e.pointerType==='mouse'&&!drawing) setGhost(p.x,p.y);
  });
  const stop=()=>{ drawing=false; }; cv.addEventListener('pointerup',stop); cv.addEventListener('pointercancel',stop);
  cv.addEventListener('pointerleave',()=>setGhost(null));

  /* ---- controls ---- */
  const seg=(items,get,set)=>{ const box=h('div',{class:'seg',role:'group'}); items.forEach(([v,l])=>{ const b=h('button',{'aria-pressed':String(get()===v),onclick:()=>{ set(v); $$('button',box).forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); }},l); box.append(b); }); return box; };
  const row=(lab,...k)=>h('div',{class:'row'},h('span',{class:'lab'},lab),...k);
  const gapRow=h('div',{class:'row'},h('span',{class:'lab'},'Gap'),h('input',{type:'range',min:'0',max:'60',value:String(PS.gap),'aria-label':'Gap between repeated flowers',oninput:e=>{ PS.gap=+e.target.value; PS.pattern=true; redraw(); }}));
  gapRow.hidden=true;
  const toolSeg=seg([['stamp','Stamp'],['brush','Brush'],['repeat','Repeat']],()=>PS.tool,v=>{ PS.tool=v; gapRow.hidden=v!=='repeat'; if(v==='repeat'){ PS.pattern=true; redraw(); } setGhost(null); });
  const picks=h('div',{class:'picks'},['radial','four','five'].map(k=>h('button',{class:'pick','aria-pressed':String(k===PS.kind),'aria-label':'Shape: '+k,onclick:e=>{ PS.kind=k; $$('.pick',picks).forEach(x=>x.setAttribute('aria-pressed',String(x===e.currentTarget))); }},h('span',{html:flowerSVG(k,COL.blue)}))));
  const swatches=(arr,get,set,label,mix)=>{ const box=h('div',{class:'picks',style:{gap:'8px',flexWrap:'wrap'}}); const all=mix?[...arr,'mix']:arr;
    all.forEach(c=>{ const b=h('button',{class:'sw','aria-pressed':String(get()===c),'aria-label':label+': '+(c==='mix'?'mixed':({[COL.pink]:'pink',[COL.blue]:'blue',[COL.lime]:'lime',[COL.cream]:'cream'})[c]),style:{background:c==='mix'?`conic-gradient(${COL.pink} 0 25%,${COL.blue} 0 50%,${COL.lime} 0 75%,${COL.cream} 0)`:c},onclick:()=>{ set(c); $$('.sw',box).forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); }}); b._c=c; box.append(b); }); return box; };
  const sizeIn=h('input',{type:'range',min:'24',max:'120',value:String(PS.size),'aria-label':'Size',oninput:e=>{ PS.size=+e.target.value; if(PS.pattern){ redraw(); } }});
  const tilt=h('label',{class:'check'},h('input',{type:'checkbox',checked:true,onchange:e=>{ PS.tilt=e.target.checked; }}),'Random tilt');
  const groundSw=swatches(COLS,()=>PS.ground,c=>{ PS.ground=c; redraw(); renderOverlay(); },'Ground');
  const cordSw=swatches(COLS,()=>PS.cord,c=>{ PS.cord=c; renderOverlay(); },'Cord');
  const undo=h('button',{class:'btn small ghost',onclick:()=>{ if(PS.ops.length){ const g=PS.ops[PS.ops.length-1].g; while(PS.ops.length&&PS.ops[PS.ops.length-1].g===g) PS.ops.pop(); } else PS.pattern=false; redraw(); }},'Undo');
  const clear=h('button',{class:'btn small ghost',onclick:()=>{ PS.ops=[]; PS.pattern=false; redraw(); }},'Clear');
  const shuf=h('button',{class:'btn small lime',onclick:shuffle},'Shuffle');
  function shuffle(){
    PS.ground=pick(COLS); PS.pattern=false; PS.ops=[];
    for(let j=0;j<4;j++) for(let i=0;i<3;i++){
      const x=PX+(i+.5)*PW/3+rand(-16,16),y=PY+(j+.5)*PH/4+rand(-14,14); if(!inPouch(x,y)) continue;
      const kind=pick(['radial','four','five']); let col=pick(COLS); if(col===PS.ground) col=COL.cream===PS.ground?COL.pink:COL.cream;
      PS.ops.push({kind,col,s:rand(44,84),rot:rand(0,6.283),x,y,g:++PS.gid});
    }
    redraw(); renderOverlay(); $$('.sw',groundSw).forEach(b=>b.setAttribute('aria-pressed',String(b._c===PS.ground)));
  }
  const edit=h('div',{class:'panel'},
    row('Tool',toolSeg),row('Shape',picks),row('Colour',swatches(COLS,()=>PS.color,c=>{ PS.color=c; },'Colour',true)),
    row('Size',sizeIn,tilt),gapRow,row('Ground',groundSw),row('Cord',cordSw),
    h('div',{class:'row'},undo,clear,shuf));
  const finishBtn=h('button',{class:'btn pink',onclick:finish},'Finish and hang it →');
  const fin=h('div',{class:'panel',hidden:true},
    h('div',{class:'row'},
      h('button',{class:'btn small pink',onclick:()=>{ sidx.kick(rand(45,70)*(Math.random()<.5?-1:1)); }},'Swing it'),
      h('button',{class:'btn small lime',onclick:carryIt},'Carry it'),
      h('button',{class:'btn small',onclick:saveImg},'Save image'),
      h('button',{class:'btn small ghost',onclick:editAgain},'Edit again')));
  let grab=null,bag=null;
  function finish(){
    PS.finished=true; setGhost(null); PS.snap=cv.toDataURL('image/png'); renderOverlay(true);
    stage.classList.add('is-finished'); edit.hidden=true; finishBtn.hidden=true; fin.hidden=false;
    grab=h('div',{style:{position:'absolute',inset:'0',zIndex:'4',touchAction:'pan-y',cursor:'grab'}}); stage.append(grab);
    dragSwing(grab,sidx); hoverKick(grab,sidx,-1.2); setTimeout(()=>sidx.kick(rand(40,60)*(Math.random()<.5?-1:1)),500);
  }
  function editAgain(){
    PS.finished=false; stage.classList.remove('is-finished'); sidx.a=0; sidx.v=0; sw.style.transform=''; if(grab){ grab.remove(); grab=null; } showStage();
    renderOverlay(); edit.hidden=false; finishBtn.hidden=false; fin.hidden=true;
  }
  function showStage(){ stage.style.display=''; bagHost.style.display='none'; bagHost.replaceChildren(); bag=null; }
  function carryIt(){
    if(bag){ showStage(); return; }
    stage.style.display='none'; bagHost.style.display='block'; bagHost.replaceChildren();
    let rec=null; const html=pendantSVG({snap:PS.snap,cord:PS.cord,ground:PS.ground});
    bag=bagStage({onPlace:(x,y)=>{ if(rec){ rec.pend.style.left=(x*100)+'%'; rec.pend.style.top=(y*100)+'%'; rec.s.kick(rand(50,90)); } }});
    rec=bag.hang(html,.28,.07,34); bagHost.append(bag);
    bagHost.append(h('div',{class:'carry-bar'},h('button',{class:'btn small pink',onclick:()=>bag.walk()},'Walk'),h('button',{class:'btn small ghost',onclick:showStage},'Back to the charm')));
  }
  function saveImg(){
    pendantPNG(pendantSVG({snap:PS.snap,cord:PS.cord,ground:PS.ground}),url=>{
      const box=h('div',{class:'saved',role:'dialog','aria-modal':'true','aria-label':'Your charm as an image'},h('button',{class:'x','aria-label':'Close',onclick:closeOverlay},'×'),
        url?h('img',{src:url,alt:'Your finished charm'}):h('p',{},'The image could not be made in this browser.'),
        );
      openOverlay(box);
    });
  }

  /* ---- initial composition so the pouch is never empty ---- */
  const g0=++PS.gid;
  [['radial',COL.pink,72,.4,112,168],['four',COL.blue,66,.2,222,246],['five',COL.lime,62,.1,118,336],['radial',COL.blue,46,.7,226,388],['four',COL.pink,40,.5,170,430]].forEach(([kind,col,s,rot,x,y])=>PS.ops.push({kind,col,s,rot,x,y,g:g0}));
  redraw(); renderOverlay();

  view.append(h('div',{class:'play'},h('h1',{class:'play-title'},'Make a charm'),wrap,h('div',{class:'panel'},edit,finishBtn,fin)));
};
