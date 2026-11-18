const $=s=>document.querySelector(s),vn=id=>VENUES.find(v=>v.id==id),cat=id=>CATS.find(c=>c.id==id);
const S={tab:'home',cat:null,q:'',sel:null,d:0,s:null,bk:JSON.parse(localStorage.getItem('bk')||'[]')};
const IC={home:'<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',explore:'<rect x="3" y="3" width="8" height="8" rx="2.5"/><rect x="13" y="3" width="8" height="8" rx="2.5"/><rect x="3" y="13" width="8" height="8" rx="2.5"/><rect x="13" y="13" width="8" height="8" rx="2.5"/>',bookings:'<path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/>',search:'<path d="M10.5 3a7.5 7.5 0 015.9 12.1l4.3 4.3-1.4 1.4-4.3-4.3A7.5 7.5 0 1110.5 3zm0 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11z"/>'};
const TABS=[['home','Inicio'],['explore','Explorar'],['bookings','Reservas'],['search','Buscar']];
const art=(v,c='')=>`<div class="art ${c}" style="--a:${v.g[0]};--b:${v.g[1]}">${v.e}</div>`;
const money=n=>'$'+n.toLocaleString('es');
const card=v=>`<button class="card" data-v="${v.id}">${art(v)}<b>${v.n}</b><small>${v.z} · ${money(v.p)}/${v.u}</small></button>`;
const row=v=>`<button class="row" data-v="${v.id}">${art(v,'sm')}<div><b>${v.n}</b><small>★ ${v.r} · ${v.z} · ${money(v.p)}/${v.u}</small></div><i>›</i></button>`;
const dayOf=i=>{const d=new Date();d.setDate(d.getDate()+i);return d};
const fmt=d=>new Date(d).toLocaleDateString('es',{weekday:'short',day:'numeric',month:'short'});
const taken=(id,d,s)=>[...(id+d+s)].reduce((a,c)=>a*31+c.charCodeAt(0)|0,7)%4==0;
const upcoming=()=>S.bk.slice().sort((a,b)=>(a.date+a.slot).localeCompare(b.date+b.slot));
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2200)}

function render(){
 let t='',h='';
 if(S.tab=='home'){t='Inicio';const f=vn(1);
  h=`<button class="hero" data-v="1" style="--a:${f.g[0]};--b:${f.g[1]}"><div class="big">${f.e}</div><div class="cap"><em>DESTACADO DE LA SEMANA</em><b>${f.n}</b><small>${f.d.slice(0,58)}…</small></div></button>
  <h2>Populares cerca de ti</h2><div class="h">${VENUES.slice().sort((a,b)=>b.r-a.r).map(card).join('')}</div>`+
  CATS.map(c=>`<h2>${c.n}<button data-cat="${c.id}">Ver todo</button></h2><div class="h">${VENUES.filter(v=>v.c==c.id).map(card).join('')}</div>`).join('')}
 else if(S.tab=='explore'){
  if(S.cat){const c=cat(S.cat);t=c.n;h=`<button class="cancel" data-cat="" style="padding-left:0">‹ Explorar</button>`+`<div class="grid">${VENUES.filter(v=>v.c==S.cat).map(card).join('')}</div>`}
  else{t='Explorar';h=`<div class="tiles" style="margin-top:16px">${CATS.map(c=>`<button class="tile" data-cat="${c.id}" style="--a:${c.g[0]};--b:${c.g[1]}"><span>${c.e}</span>${c.n}</button>`).join('')}</div>`}}
 else if(S.tab=='bookings'){t='Reservas';const u=upcoming();
  h=u.length?`<h2>Próximas</h2>`+u.map(b=>{const v=vn(b.v);return `<div class="row" style="cursor:default">${art(v,'sm')}<div><b>${v.n}</b><small style="text-transform:capitalize">${fmt(b.date)} · ${b.slot}</small></div><button class="cancel" data-cancel="${b.id}">Cancelar</button></div>`}).join(''):`<div class="empty"><span>🗓️</span><b>Aún no tienes reservas</b><small>Explora lugares y reserva tu primer horario.</small></div>`}
 else{t='Buscar';h=`<div class="sb"><input id="q" type="search" placeholder="Canchas, barberías, yates…" value="${S.q}" autocomplete="off"></div><div class="pills">${CATS.map(c=>`<button class="pill ${S.cat==c.id?'on':''}" data-pill="${c.id}">${c.e} ${c.n}</button>`).join('')}</div><div id="res" style="margin-top:8px">${results()}</div>`}
 $('#view').innerHTML=`<h1>${t}</h1>${h}`;
 $('#bar span').textContent=t;
 $('#side').innerHTML=`<div class="brand"><i>◐</i>Bookealo</div>`+TABS.map(([k,l])=>`<button data-tab="${k}" class="${S.tab==k&&!S.cat||S.tab==k&&k!='explore'?'on':''}"><svg viewBox="0 0 24 24">${IC[k]}</svg>${l}${k=='bookings'&&S.bk.length?`<em>${S.bk.length}</em>`:''}</button>`).join('')+`<h4>Categorías</h4>`+CATS.map(c=>`<button data-cat="${c.id}" class="${S.cat==c.id&&S.tab=='explore'?'on':''}"><span>${c.e}</span>${c.n}</button>`).join('');
 $('#tabs').innerHTML=TABS.map(([k,l])=>`<button data-tab="${k}" class="${S.tab==k?'on':''}"><svg viewBox="0 0 24 24">${IC[k]}</svg>${l}</button>`).join('');
 mini();
}
function results(){const q=S.q.toLowerCase();const r=VENUES.filter(v=>(!S.cat||v.c==S.cat)&&(v.n+v.z+cat(v.c).n+v.t.join()).toLowerCase().includes(q));return r.length?'<div class="grid">'+r.map(card).join('')+'</div>':`<div class="empty"><span>🔍</span>Sin resultados para “${S.q}”</div>`}
function mini(){const m=$('#mini'),b=upcoming()[0];if(!b||S.tab=='bookings'){m.classList.remove('on');return}const v=vn(b.v);
 m.innerHTML=`<button data-tab="bookings">${art(v)}<div><b>${v.n}</b><small style="text-transform:capitalize">Próxima · ${fmt(b.date)} · ${b.slot}</small></div><u>Ver</u></button>`;m.classList.add('on')}

function openSheet(id){
 const v=vn(id),c=cat(v.c);S.sel=v;S.d=0;S.s=null;
 const sh=$('#sheet');sh.style.setProperty('--a',v.g[0]);
 sh.innerHTML=`<div class="top" id="top"><div class="grab"></div><button class="x" aria-label="Cerrar">✕</button>${art(v)}<h3>${v.n}</h3><small>★ ${v.r} · ${v.z} · ${c.n}</small></div>
 <div class="body"><p>${v.d}</p><div class="tags">${v.t.map(x=>`<span>${x}</span>`).join('')}</div>
 <h2>Elige un día</h2><div class="days" id="days"></div><h2>Horarios disponibles</h2><div class="slots" id="slots"></div></div>
 <div class="cta"><div><b id="tot">${money(v.p)}</b><small>por ${v.u}</small></div><button id="go" data-book disabled>Reservar</button></div>`;
 days();slots();sh.classList.add('on');$('#scrim').classList.add('on');drag();
}
function days(){$('#days').innerHTML=[...Array(10)].map((_,i)=>{const d=dayOf(i);return `<button class="day ${S.d==i?'on':''}" data-d="${i}">${d.toLocaleDateString('es',{weekday:'short'})}<b>${d.getDate()}</b></button>`}).join('')}
function slots(){const v=S.sel,iso=dayOf(S.d).toISOString().slice(0,10);
 $('#slots').innerHTML=cat(v.c).slots.map(s=>`<button class="slot ${taken(v.id,iso,s)||S.bk.some(b=>b.v==v.id&&b.date==iso&&b.slot==s)?'off':''} ${S.s==s?'on':''}" data-s="${s}">${s}</button>`).join('');
 $('#go').disabled=!S.s}
function closeSheet(){$('#sheet').classList.remove('on');$('#sheet').style.transform='';$('#scrim').classList.remove('on')}
function drag(){if(innerWidth>=900)return;const top=$('#top'),sh=$('#sheet');let y0=null,dy=0;
 top.onpointerdown=e=>{y0=e.clientY;sh.classList.add('drag');top.setPointerCapture(e.pointerId)};
 top.onpointermove=e=>{if(y0==null)return;dy=Math.max(0,e.clientY-y0);sh.style.transform=`translateY(${dy}px)`;$('#scrim').style.opacity=1-dy/600};
 top.onpointerup=()=>{if(y0==null)return;sh.classList.remove('drag');$('#scrim').style.opacity='';y0=null;dy>120?closeSheet():sh.style.transform='';dy=0}}

document.addEventListener('click',e=>{
 const t=e.target.closest('[data-v],[data-tab],[data-cat],[data-pill],[data-d],[data-s],[data-book],[data-cancel]'),D=t&&t.dataset;
 if(e.target.id=='scrim'||e.target.closest('.x'))return closeSheet();if(!t)return;navigator.vibrate&&navigator.vibrate(8);
 if('v'in D)openSheet(D.v);
 else if('tab'in D){S.tab=D.tab;S.cat=null;S.q='';render();scrollTo(0,0)}
 else if('cat'in D){S.cat=D.cat||null;S.tab='explore';render();scrollTo(0,0)}
 else if('pill'in D){S.cat=S.cat==D.pill?null:D.pill;render()}
 else if('d'in D){S.d=+D.d;S.s=null;days();slots()}
 else if('s'in D){S.s=D.s;slots()}
 else if('book'in D){const v=S.sel;S.bk.push({id:Date.now(),v:v.id,date:dayOf(S.d).toISOString().slice(0,10),slot:S.s});localStorage.setItem('bk',JSON.stringify(S.bk));closeSheet();render();toast('✓ Reserva confirmada')}
 else if('cancel'in D){S.bk=S.bk.filter(b=>b.id!=D.cancel);localStorage.setItem('bk',JSON.stringify(S.bk));render();toast('Reserva cancelada')}
});
document.addEventListener('input',e=>{if(e.target.id=='q'){S.q=e.target.value;$('#res').innerHTML=results()}});
addEventListener('scroll',()=>$('#bar').classList.toggle('on',scrollY>44),{passive:true});
render();
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

addEventListener('keydown',e=>e.key=='Escape'&&closeSheet());
document.addEventListener('mouseover',e=>{const t=e.target.closest('[data-v]');if(t)document.body.style.setProperty('--amb',vn(t.dataset.v).g[0])});
