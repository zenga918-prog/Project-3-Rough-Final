/* ===== home ===== */
/* each omamori hangs by its own cord, held on the lime rail by a peg */
function hangOmamori(parent,o){
  const slot=h('div',{class:'hang'});
  const sw=h('div',{class:'swing'}); const img=h('img',{src:A(o.k),alt:'',draggable:'false'});
  sw.append(img,h('i',{class:'peg'})); slot.append(sw); parent.append(slot);
  const s=swing(sw,{w:2.2,z:.1,max:45,idle:.5}); hoverKick(slot,s,-1.1); dragSwing(slot,s);
  o.img=img; o.slot=slot;
}
/* sizes follow the width of the rail; the omamori are spread evenly so none runs off the edge */
function layoutHero(art){
  const W=art.clientWidth, sc=W<500?clamp(W/560,.45,.9):clamp(W/680,.5,1.15);
  const ws=OMA.map(o=>Math.round(o.h*sc*OMA_META[o.k].aspect));
  const gap=Math.min(30,Math.max(-26,(W-ws.reduce((p,c)=>p+c,0))/(OMA.length-1)));
  let x=0;
  OMA.forEach((o,i)=>{ const m=OMA_META[o.k]; o.slot.style.left=(x+m.px*ws[i])+'px'; o.img.style.width=ws[i]+'px'; o.img.style.left=(-m.px*ws[i])+'px'; x+=ws[i]+gap; });
  art.style.height=(Math.max(...OMA.map(o=>o.h))*sc+44)+'px';
}
ROUTES.home=view=>{
  const art=h('div',{class:'hero-art','aria-label':'Omamori hanging from a rail. Drag them to swing.'});
  view.append(h('section',{class:'hero'},
    h('div',{class:'hero-copy'},
      h('h1',{},'Lucky Charms'),
      h('p',{class:'lede'},'Omamori and xiangnang are small cloth charms that people carry for luck. Here you can swing them around and make one of your own.')),
    art));
  OMA.forEach(o=>hangOmamori(art,o)); layoutHero(art);
  const onResize=()=>{ if(art.isConnected) layoutHero(art); else removeEventListener('resize',onResize); }; addEventListener('resize',onResize);
  const door=(col,to,title,text,kind,fcol)=>h('a',{class:'door '+col,href:'#'+to},h('div',{},h('h2',{},title),h('p',{},text)),h('span',{class:'arrow','aria-hidden':'true'},'→'),h('div',{class:'deco',html:flowerSVG(kind,fcol)}));
  view.append(h('section',{class:'doors','aria-label':'Sections'},
    door('blue','explore','Explore','Look closely at the charms.','radial',COL.cream),
    door('pink','play','Play','Make one of your own.','four',COL.blue),
    door('lime','stories','Stories','Five short stories.','five',COL.pink)));
};

/* ===== explore: kept, left empty for now ===== */
ROUTES.explore=view=>{
  view.append(h('header',{class:'page-head'},h('h1',{},'Explore')),h('div',{class:'blank'}));
};

/* ===== stories: only the titles for now ===== */
ROUTES.stories=view=>{
  view.append(h('header',{class:'page-head'},h('h1',{},'Five Stories')));
  const grid=h('div',{class:'s-index'});
  STORIES.forEach(s=>grid.append(h('a',{class:`s-card ${s.col}${s.major?' major':''}`,href:'#'+s.id},h('h2',{},s.title),h('div',{class:'deco','aria-hidden':'true',html:flowerSVG(s.deco,s.dcol)}))));
  view.append(grid);
};
STORIES.forEach(s=>{ ROUTES[s.id]=view=>{ view.append(h('header',{class:`s-head ${s.col}`},h('h1',{},s.title))); }; });
