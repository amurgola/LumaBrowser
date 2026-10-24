class ActivityPages {
  static ICONS = {
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5v9M10.5 3.5v9"/></svg>',
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6L12.6 8z" class="fill"/></svg>',
    stop: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="4" width="8" height="8" rx="1.5" class="fill"/></svg>',
    open: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 3.5h-3v9h9v-3M9 3.5h3.5V7M12.5 3.5 7.5 8.5"/></svg>',
    close: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>',
  };

  static RING_PAD = 18;

  static dataUrl(html) {
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  }

  static ringHtml(tokensCss) {
    const pad = ActivityPages.RING_PAD;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${tokensCss || ''}
@property --a{syntax:'<angle>';inherits:false;initial-value:0deg}
html,body{margin:0;height:100%;background:transparent;overflow:hidden;pointer-events:none}
.ring{position:fixed;inset:0;opacity:0;transition:opacity .45s ease}
.ring.on{opacity:1}
/* The lit area: the whole monitor, or a picked window (inset by the pad so its glow can spill outside). */
.box{position:absolute;inset:0}
.ring.framed .box{inset:${pad}px;border-radius:10px}
/* The edge light: brightest along the top, thinning down the sides, barely there at the bottom. */
.edge{position:absolute;inset:0;border-radius:inherit;
  box-shadow:inset 0 0 0 2px rgba(245,144,52,.62),inset 0 0 10px rgba(255,176,107,.30),inset 0 0 36px rgba(245,144,52,.22),inset 0 0 90px rgba(245,144,52,.08);
  -webkit-mask-image:linear-gradient(to bottom,#000 0%,rgba(0,0,0,.75) 35%,rgba(0,0,0,.42) 100%);
  mask-image:linear-gradient(to bottom,#000 0%,rgba(0,0,0,.75) 35%,rgba(0,0,0,.42) 100%)}
.ring.framed .edge{-webkit-mask-image:none;mask-image:none;
  box-shadow:inset 0 0 0 2px rgba(255,176,107,.8),inset 0 0 16px rgba(245,144,52,.30),0 0 0 1px rgba(255,176,107,.55),0 0 ${pad}px rgba(245,144,52,.40)}
/* The pool: where the island's light gathers, a soft band across the top center. */
.pool{position:absolute;left:50%;top:0;width:min(56vw,900px);height:5px;transform:translateX(-50%);
  background:linear-gradient(90deg,transparent,var(--accent-2,#ffb06b) 35%,#fff3e6 50%,var(--accent-2,#ffb06b) 65%,transparent);
  filter:blur(2.5px);opacity:.9}
.halo{position:absolute;left:50%;top:-60px;width:min(46vw,720px);height:130px;transform:translateX(-50%);
  background:radial-gradient(closest-side,rgba(255,176,107,.20),rgba(245,144,52,.07) 55%,transparent);filter:blur(4px)}
/* Armed layers: two comets orbiting the edge (a crisp line and its soft bloom) and the ignition sweep. */
.band,.ignite,.flare{position:absolute;inset:0;border-radius:inherit;overflow:hidden;opacity:0}
.band.line{padding:2px;box-sizing:border-box;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude}
.band.soft,.ignite .fill,.flare .fill{--w:30px;
  mask:linear-gradient(to bottom,#000,transparent) top/100% var(--w) no-repeat,linear-gradient(to top,#000,transparent) bottom/100% var(--w) no-repeat,
    linear-gradient(to right,#000,transparent) left/var(--w) 100% no-repeat,linear-gradient(to left,#000,transparent) right/var(--w) 100% no-repeat}
.spin{position:absolute;left:50%;top:50%;width:300vmax;height:300vmax;margin:-150vmax 0 0 -150vmax;will-change:transform;
  background:conic-gradient(from -20deg,transparent 0deg,rgba(245,144,52,0) 6deg,rgba(245,144,52,.55) 30deg,rgba(255,220,180,.95) 38deg,transparent 44deg,
    transparent 180deg,rgba(245,144,52,0) 186deg,rgba(245,144,52,.55) 210deg,rgba(255,220,180,.95) 218deg,transparent 224deg)}
.ignite{mask:conic-gradient(from 0deg,#000 0deg,#000 var(--a),transparent calc(var(--a) + 8deg),transparent calc(352deg - var(--a)),#000 calc(360deg - var(--a)))}
.ignite .fill,.flare .fill{position:absolute;inset:0}
.ignite .fill{--w:16px;background:rgba(255,166,92,.75)}
/* The sweep's head: a short hot stretch just behind the leading edge on each side. */
.flare{mask:conic-gradient(from 0deg,transparent calc(var(--a) - 16deg),#000 var(--a),transparent calc(var(--a) + 1deg),transparent calc(359deg - var(--a)),#000 calc(360deg - var(--a)),transparent calc(376deg - var(--a)))}
.flare .fill{--w:30px;background:linear-gradient(#fff6ea,#ffd2a3)}
.ring.live .edge{animation:breathe 3.4s ease-in-out infinite}
.ring.live .halo{animation:breathe 3.4s ease-in-out infinite}
.ring.paused .edge,.ring.paused .halo,.ring.paused .pool{opacity:.32;animation:none}
.ring.busy .pool{background-size:200% 100%;animation:travel 1.6s linear infinite}
/* Armed (the modifier keys held): a spark at the top center, light sweeping down both sides to meet at the bottom,
   then the edge settles into a slow pulse with the bloom breathing against it while two comets orbit. */
.ring.on.armed{transition:none}
.ring.armed .edge{box-shadow:inset 0 0 0 2.5px rgba(255,176,107,.78),inset 0 0 14px rgba(255,176,107,.36),inset 0 0 48px rgba(245,144,52,.26),inset 0 0 120px rgba(245,144,52,.10);
  animation:rise .5s ease-out .12s both,edgePulse 2.4s ease-in-out .62s infinite}
.ring.framed.armed .edge{box-shadow:inset 0 0 0 2.5px rgba(255,190,130,.9),inset 0 0 18px rgba(245,144,52,.34),0 0 0 1px rgba(255,176,107,.6),0 0 ${pad}px rgba(245,144,52,.5)}
.ring.armed .band.line{animation:rise .45s ease-out .4s both}
.ring.armed .band.soft{animation:rise .45s ease-out .4s both,bloomPulse 2.4s ease-in-out .85s infinite}
.ring.armed .spin{animation:orbit 5.5s linear infinite}
.ring.armed .ignite{animation:ignite .95s cubic-bezier(.25,.8,.25,1) both}
.ring.armed .flare{animation:flare .95s cubic-bezier(.25,.8,.25,1) both}
.ring.armed .halo{background:radial-gradient(closest-side,rgba(255,200,150,.42),rgba(245,144,52,.14) 55%,transparent);
  animation:spark .8s cubic-bezier(.2,.9,.3,1.3) both,haloPulse 2.4s ease-in-out .8s infinite}
.ring.armed .pool{animation:poolFlash .8s ease-out both}
@keyframes rise{from{opacity:0}to{opacity:1}}
/* The two sides meet at the bottom; jumping on to 360deg closes the seam the meeting stops would leave. */
@keyframes ignite{0%{--a:0deg;opacity:1}55%{--a:180deg;opacity:1}58%{--a:360deg}100%{--a:360deg;opacity:0}}
@keyframes flare{0%{--a:0deg;opacity:1}55%{--a:180deg;opacity:1}70%{--a:180deg;opacity:0}100%{--a:180deg;opacity:0}}
@keyframes spark{0%{opacity:0;transform:translateX(-50%) scale(.2)}30%{opacity:1;transform:translateX(-50%) scale(1.25,1.7)}100%{opacity:.85;transform:translateX(-50%) scale(1)}}
@keyframes haloPulse{0%,100%{opacity:.85;transform:translateX(-50%) scale(1)}50%{opacity:1;transform:translateX(-50%) scale(1.12,1.35)}}
@keyframes poolFlash{0%{opacity:0;width:4vw}35%{opacity:1}100%{opacity:.9}}
@keyframes edgePulse{0%,100%{opacity:1}50%{opacity:.58}}
@keyframes bloomPulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes orbit{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.72}}
@keyframes breathe{0%,100%{opacity:.62}50%{opacity:1}}
@keyframes travel{from{background-position:100% 0}to{background-position:-100% 0}}
@media (prefers-reduced-motion:reduce){.ring,.ring *{animation:none!important;transition:none!important}.ring.armed .band{opacity:1}.ignite,.flare{display:none}}
</style></head><body><div class="ring" id="ring"><div class="box">
<div class="edge"></div><div class="halo"></div><div class="pool"></div>
<div class="band soft"><div class="spin"></div></div><div class="band line"><div class="spin"></div></div>
<div class="ignite"><div class="fill"></div></div><div class="flare"><div class="fill"></div></div></div></div>
<script>
(function(){var lock=null;
window.__ring={render:function(s){var r=document.getElementById('ring');s=s||{};
var cls='ring'+(s.on?' on':'')+(s.mode?' '+s.mode:'')+(s.framed?' framed':'');
// A new aim (another window, or back to the monitor) replays the ignition.
if(s.mode==='armed'&&s.lock!==lock&&lock!==null){r.className=cls.replace(' armed','');void r.offsetWidth;}
lock=s.mode==='armed'?s.lock:null;
r.className=cls;return true;}};})();
</script></body></html>`;
  }

  static islandHtml(tokensCss) {
    const icons = JSON.stringify(ActivityPages.ICONS);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${tokensCss || ''}
@property --spin{syntax:'<angle>';inherits:false;initial-value:0deg}
html,body{margin:0;background:transparent;overflow:hidden;user-select:none;-webkit-user-select:none;cursor:default}
body{font-family:var(--font-sans,"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif);color:var(--text-primary,#e6e9f2);
  display:flex;flex-direction:column;align-items:center;padding:10px 18px 22px}
.pill{position:relative;display:flex;align-items:center;gap:10px;height:44px;padding:0 6px 0 13px;box-sizing:border-box;
  border-radius:22px;background:rgba(20,27,44,.96);
  box-shadow:0 0 0 1px rgba(255,255,255,.08),inset 0 1px 0 rgba(255,255,255,.05),0 1px 2px rgba(0,0,0,.28),0 4px 12px rgba(0,0,0,.28),0 0 10px rgba(245,144,52,.12);
  clip-path:inset(0 calc(50% - 22px) round 22px);opacity:0;transition:clip-path .32s cubic-bezier(.2,.9,.2,1),opacity .18s ease}
.pill.in{clip-path:inset(0 0 round 22px);opacity:1}
.mark{flex:none;width:18px;height:18px;display:flex;align-items:center;justify-content:center;color:var(--accent,#f59034)}
.bars{display:flex;align-items:center;gap:2px;height:14px}
.bars i{display:block;width:2.5px;height:4px;border-radius:2px;background:currentColor;animation:eq 1s ease-in-out infinite}
.bars i:nth-child(2){animation-delay:-.25s}.bars i:nth-child(3){animation-delay:-.6s}.bars i:nth-child(4){animation-delay:-.4s}
.paused .bars i{animation:none;height:4px;opacity:.6}
@keyframes eq{0%,100%{height:4px}50%{height:14px}}
.spin{width:14px;height:14px;border-radius:50%;background:conic-gradient(from 0deg,transparent 0 25%,currentColor);
  -webkit-mask:radial-gradient(circle,transparent 4.5px,#000 5px);mask:radial-gradient(circle,transparent 4.5px,#000 5px);animation:rot .9s linear infinite}
@keyframes rot{to{transform:rotate(360deg)}}
.dot{width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor}
.error .mark{color:var(--warning,#fbbf24)}
.text{display:flex;flex-direction:column;justify-content:center;min-width:0;max-width:280px;padding-right:4px}
.title{font-size:var(--text-md,13px);font-weight:600;line-height:17px;white-space:nowrap}
.detail{font-size:var(--text-sm,12px);line-height:15px;color:var(--text-secondary,#8a95ad);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.detail:empty{display:none}
.actions{display:flex;gap:2px}
.actions:empty{display:none}
button{all:unset;width:32px;height:32px;border-radius:16px;display:flex;align-items:center;justify-content:center;
  color:var(--text-secondary,#8a95ad);transition:background .12s ease,color .12s ease}
button:hover{background:var(--surface-active,rgba(255,255,255,.07));color:var(--text-primary,#e6e9f2)}
button.primary:hover{color:var(--accent-2,#ffb06b)}
button:active{background:rgba(255,255,255,.11)}
svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
svg .fill{fill:currentColor;stroke:none}
.keys{display:flex;align-items:center;gap:4px;padding-right:6px}
.keys:empty{display:none}
.hint{font-size:var(--text-sm,12px);color:var(--text-muted,#76819b);white-space:nowrap;padding-right:6px}
.hint:empty{display:none}
.chip{all:unset;display:flex;align-items:center;gap:7px;height:32px;padding:0 10px 0 5px;border-radius:16px;color:var(--text-secondary,#8a95ad);
  font-size:var(--text-sm,12px);white-space:nowrap;transition:background .12s ease,color .12s ease}
.chip:hover{background:var(--surface-active,rgba(255,255,255,.07));color:var(--text-primary,#e6e9f2)}
.chip{animation:chipIn .36s cubic-bezier(.2,.9,.3,1.25) both;animation-delay:calc(var(--i,0) * 45ms + 90ms)}
.chip.off kbd,.chip.off span{opacity:.4}
.chip.off:hover{background:transparent;color:var(--text-secondary,#8a95ad)}
@keyframes chipIn{from{opacity:0;transform:translateY(5px) scale(.94)}to{opacity:1;transform:none}}
kbd{min-width:22px;height:22px;box-sizing:border-box;padding:0 5px;display:inline-flex;align-items:center;justify-content:center;
  font:600 var(--text-sm,12px)/1 var(--font-sans,"Segoe UI Variable Text","Segoe UI",sans-serif);color:var(--text-primary,#e6e9f2);
  background:var(--bg-surface-2,#172038);border-radius:var(--radius-sm,4px);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.12),inset 0 -2px 0 rgba(0,0,0,.35)}
.chip:not(.off):hover kbd{box-shadow:inset 0 0 0 1px var(--accent,#f59034),inset 0 -2px 0 rgba(0,0,0,.35);color:var(--accent-2,#ffb06b)}
.keys-mode .text{display:none}
.keys-mode{padding-right:4px}
/* The shortcut hint: a brighter underglow, a light running round the pill's rim (the ring's comets in small),
   a springy open and the keys arriving one after another. */
.pill.keys-mode{box-shadow:0 0 0 1px rgba(255,176,107,.16),inset 0 1px 0 rgba(255,255,255,.06),0 1px 2px rgba(0,0,0,.28),0 4px 12px rgba(0,0,0,.28),0 0 12px rgba(245,144,52,.22)}
.pill.keys-mode::before{content:'';position:absolute;inset:0;border-radius:22px;padding:1.2px;box-sizing:border-box;pointer-events:none;
  background:conic-gradient(from var(--spin),transparent 0 55%,rgba(245,144,52,.7) 72%,#ffe2c2 80%,transparent 88%);
  mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;animation:rim 3.2s linear infinite}
.pill.keys-mode.in{animation:pop .45s cubic-bezier(.3,1.45,.55,1) both}
@keyframes rim{to{--spin:360deg}}
@keyframes pop{from{transform:scale(.88)}to{transform:none}}
/* What the pointed-at key will do (or why it cannot), under the pill. */
.caption{margin-top:6px;box-sizing:border-box;padding:4px 11px;border-radius:11px;background:rgba(20,27,44,.94);
  box-shadow:0 0 0 1px rgba(255,255,255,.06),0 1px 2px rgba(0,0,0,.25),0 3px 8px rgba(0,0,0,.25);font-size:var(--text-sm,12px);line-height:16px;
  color:var(--text-secondary,#8a95ad);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  opacity:0;transform:translateY(-4px);transition:opacity .18s ease,transform .18s ease}
.caption.on{opacity:1;transform:none;transition-delay:.2s}
.caption[hidden]{display:none}
.progress{position:absolute;left:18px;right:18px;bottom:0;height:2px;border-radius:1px;background:rgba(255,255,255,.06);overflow:hidden}
.progress[hidden]{display:none}
.progress span{display:block;height:100%;width:0;background:var(--accent,#f59034);transition:width .5s ease}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.pill{clip-path:none}}
</style></head><body><div class="pill" id="pill"><div class="mark" id="mark"></div>
<div class="text"><div class="title" id="title"></div><div class="detail" id="detail"></div></div>
<div class="hint" id="hint"></div><div class="keys" id="keys"></div><div class="actions" id="actions"></div><div class="progress" id="progress" hidden><span id="fill"></span></div></div><div class="caption" id="caption" hidden></div>
<script>
(function(){
var ICONS=${icons};
var waiting=[];var queued=[];var hover=null;var base='';var shown=false;
function caption(t){var c=document.getElementById('caption');c.textContent=t||' ';c.classList.toggle('on',shown&&!!t);}
function mark(kind){if(kind==='speech')return '<div class="bars"><i></i><i></i><i></i><i></i></div>';
if(kind==='busy')return '<div class="spin"></div>';
if(kind==='done')return '<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg>';
if(kind==='error')return '<svg viewBox="0 0 16 16"><path d="M8 4.5v4.2M8 11.3v.2"/><circle cx="8" cy="8" r="6"/></svg>';
return '<div class="dot"></div>';}
function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function emit(id){if(waiting.length)waiting.shift()(id);else queued.push(id);}
window.__island={
render:function(s){var pill=document.getElementById('pill');var keysMode=s.kind==='keys';shown=!!s.visible;
pill.className='pill'+(s.visible?' in':'')+' '+(s.kind||'')+(s.paused?' paused':'')+(s.kind==='keys'?' keys-mode':'');
document.getElementById('hint').textContent=s.hint||'';
var k=document.getElementById('keys');var ksig=JSON.stringify(s.keys||[]);
if(k.dataset.sig!==ksig){k.dataset.sig=ksig;k.innerHTML='';hover=null;(s.keys||[]).forEach(function(key,i){var c=document.createElement('button');
c.className='chip'+(key.disabled?' off':'');c.style.setProperty('--i',i);if(key.disabled)c.setAttribute('aria-disabled','true');
c.innerHTML='<kbd>'+esc(key.key)+'</kbd><span>'+esc(key.label)+'</span>';
c.addEventListener('mouseenter',function(){hover=key.id;caption(key.note||key.label);});
c.addEventListener('mouseleave',function(){if(hover===key.id){hover=null;caption(base);}});
c.addEventListener('click',function(){if(!key.disabled)emit(key.id);});k.appendChild(c);});}
var cap=document.getElementById('caption');cap.hidden=!keysMode;base=s.caption||'';if(!hover)caption(base);else cap.classList.toggle('on',shown);
var m=document.getElementById('mark');if(m.dataset.kind!==s.kind){m.innerHTML=mark(s.kind);m.dataset.kind=s.kind||'';}
document.getElementById('title').textContent=s.title||'';
document.getElementById('detail').textContent=s.detail||'';
var a=document.getElementById('actions');var sig=JSON.stringify(s.actions||[]);
if(a.dataset.sig!==sig){a.dataset.sig=sig;a.innerHTML='';(s.actions||[]).forEach(function(act){var b=document.createElement('button');
b.title=act.label;b.setAttribute('aria-label',act.label);if(act.primary)b.className='primary';b.innerHTML=ICONS[act.icon]||'';
b.addEventListener('click',function(){emit(act.id);});a.appendChild(b);});}
var p=document.getElementById('progress');if(typeof s.progress==='number'){p.hidden=false;document.getElementById('fill').style.width=Math.round(s.progress*100)+'%';}else{p.hidden=true;}
var r=pill.getBoundingClientRect();var w=r.width;var h=r.height;
if(keysMode){cap.style.maxWidth=Math.round(w)+'px';h+=cap.offsetHeight+6;}
return{width:Math.ceil(w)+36,height:Math.ceil(h)+32};},
next:function(){return new Promise(function(res){if(queued.length)res(queued.shift());else waiting.push(res);});},
release:function(){while(waiting.length)waiting.shift()(null);}
};})();
</script></body></html>`;
  }
}

module.exports = ActivityPages;
