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
html,body{margin:0;height:100%;background:transparent;overflow:hidden;pointer-events:none}
.ring{position:fixed;inset:0;opacity:0;transition:opacity .45s ease}
.ring.on{opacity:1}
/* The lit area: the whole monitor, or a picked window (inset by the pad so its glow can spill outside; a side
   the screen cut the pad off gets its own inset from render(), 0 at the edge). --W/--H are its size in px,
   measured by the script (the side strips are laid out along them). */
.box{position:absolute;inset:0;--W:100vw;--H:100vh;--w:30px;--Lf:160px;--Lc:400px}
.ring.framed .box{inset:${pad}px;border-radius:10px}
.edge,.crown,.side,.halo,.pool,.strip,.g,.body,.flare,.comet,.line,.bloom{position:absolute}
/* The edge light: a line and its inner glow all round, the crown and the sides' fade making the top brightest,
   the sides thinning down, the bottom barely there. */
.edge{inset:0;border-radius:inherit;box-shadow:inset 0 0 0 2px rgba(245,144,52,.40),inset 0 0 10px rgba(255,176,107,.18),inset 0 0 36px rgba(245,144,52,.13),inset 0 0 90px rgba(245,144,52,.05)}
.crown{left:0;right:0;top:0;height:150px;background:linear-gradient(to bottom,rgba(245,144,52,.17),rgba(245,144,52,.05) 45%,transparent)}
.crown::before{content:'';position:absolute;left:0;right:0;top:0;height:2px;background:rgba(245,144,52,.30)}
.side{top:0;width:3px;height:70%;background:linear-gradient(to bottom,rgba(245,144,52,.30),rgba(245,144,52,.12) 45%,transparent)}
.side.l{left:0}.side.r{right:0}
.ring.framed .crown,.ring.framed .side{display:none}
.ring.framed .edge{box-shadow:inset 0 0 0 2px rgba(255,176,107,.8),inset 0 0 16px rgba(245,144,52,.30),0 0 0 1px rgba(255,176,107,.55),0 0 ${pad}px rgba(245,144,52,.40)}
/* The pool: where the island's light gathers, a soft band across the top center. */
.pool{left:50%;top:0;width:min(56vw,900px);height:5px;transform:translateX(-50%);
  background:linear-gradient(90deg,transparent,var(--accent-2,#ffb06b) 35%,#fff3e6 50%,var(--accent-2,#ffb06b) 65%,transparent);
  filter:blur(2.5px);opacity:.9}
.halo{left:50%;top:-60px;width:min(46vw,720px);height:130px;transform:translateX(-50%);
  background:radial-gradient(closest-side,rgba(255,176,107,.20),rgba(245,144,52,.07) 55%,transparent);filter:blur(4px)}
/* The armed layers live in four strips along the edges, each clipped by overflow (a clip, never a mask: a frame
   drawn before a mask is ready would flood the screen with the fill under it). Every strip is laid out along its
   own x axis, clockwise, and turned into place, so one set of motions serves all four. */
.strip{overflow:hidden;transform-origin:0 0;top:0;left:0;height:var(--w);width:var(--W)}
.strip.r{left:var(--W);width:var(--H);transform:rotate(90deg)}
.strip.b{left:var(--W);top:var(--H);transform:rotate(180deg)}
.strip.l{top:var(--H);width:var(--H);transform:rotate(270deg)}
.ring.framed .strip{border-radius:10px 10px 0 0}
.g{inset:0;opacity:0}
/* Ignition: from the top center, light sweeps both ways (A clockwise, B counter-clockwise) to meet at the bottom
   center: each body is revealed by a scale from the end the sweep enters; a hot flare runs just behind the head. */
.body{top:0;height:16px;transform:scaleX(0);background:linear-gradient(to bottom,rgba(255,166,92,.75),rgba(255,166,92,0))}
.body.tA,.body.bB{left:50%;width:50%}
.body.tB,.body.bA{left:0;width:50%}
.body.r,.body.l{left:0;width:100%}
.body.tA,.body.r,.body.bA{transform-origin:0 0}
.body.tB,.body.l,.body.bB{transform-origin:100% 0}
.flare{top:0;left:0;height:12px;width:var(--Lf);transform:translateX(-200vmax);filter:blur(2px);
  background:linear-gradient(to right,transparent,#ffd2a3 60%,#fff6ea)}
.flare.rev{background:linear-gradient(to left,transparent,#ffd2a3 60%,#fff6ea)}
/* Two comets orbiting the edge: a crisp line and its bloom (a blurred copy), half a lap apart. */
.comet{top:0;left:0;width:var(--Lc);height:var(--w);transform:translateX(-200vmax)}
.line{left:0;right:0;top:0;height:2px;background:linear-gradient(to right,transparent,rgba(245,144,52,.55) 72%,rgba(255,220,180,.95) 92%,transparent)}
.bloom{left:0;right:0;top:0;height:7px;filter:blur(8px);opacity:.9;background:linear-gradient(to right,transparent,rgba(245,144,52,.7) 72%,rgba(255,220,180,1) 92%,transparent)}
.ring.live .edge,.ring.live .crown,.ring.live .side{animation:breathe 3.4s ease-in-out infinite}
.ring.live .halo{animation:breathe 3.4s ease-in-out infinite}
.ring.paused .edge,.ring.paused .crown,.ring.paused .side,.ring.paused .halo,.ring.paused .pool{opacity:.32;animation:none}
.ring.busy .pool{background-size:200% 100%;animation:travel 1.6s linear infinite}
/* Armed (the modifier keys held): a spark at the top center, light sweeping down both sides to meet at the bottom,
   then the edge settles into a slow pulse with the bloom breathing against it while two comets orbit. */
.ring.on.armed{transition:none}
.ring.armed .edge{box-shadow:inset 0 0 0 2.5px rgba(255,176,107,.5),inset 0 0 14px rgba(255,176,107,.22),inset 0 0 48px rgba(245,144,52,.16),inset 0 0 120px rgba(245,144,52,.07)}
.ring.armed .crown{background:linear-gradient(to bottom,rgba(245,144,52,.22),rgba(245,144,52,.07) 45%,transparent)}
.ring.armed .crown::before{background:rgba(255,176,107,.38)}
.ring.armed .side{background:linear-gradient(to bottom,rgba(255,176,107,.36),rgba(245,144,52,.14) 45%,transparent)}
.ring.armed .edge,.ring.armed .crown,.ring.armed .side{animation:rise .5s ease-out .12s both,edgePulse 2.4s ease-in-out .62s infinite}
.ring.framed.armed .edge{box-shadow:inset 0 0 0 2.5px rgba(255,190,130,.9),inset 0 0 18px rgba(245,144,52,.34),0 0 0 1px rgba(255,176,107,.6),0 0 ${pad}px rgba(245,144,52,.5)}
.ring.armed .g.ignite{animation:igniteFade .97s linear both}
.ring.armed .g.flares{animation:flareFade .97s linear both}
.ring.armed .g.comets{animation:rise .45s ease-out .4s both}
.ring.armed .bloom{animation:bloomPulse 2.4s ease-in-out .85s infinite}
.ring.armed .body.tA,.ring.armed .body.tB{animation:bodyT .97s linear both}
.ring.armed .body.r,.ring.armed .body.l{animation:bodyS .97s linear both}
.ring.armed .body.bA,.ring.armed .body.bB{animation:bodyB .97s linear both}
.ring.armed .flare.tA{animation:flareTA .97s linear both}.ring.armed .flare.tB{animation:flareTB .97s linear both}
.ring.armed .flare.r{animation:flareR .97s linear both}.ring.armed .flare.l{animation:flareL .97s linear both}
.ring.armed .flare.bA{animation:flareBA .97s linear both}.ring.armed .flare.bB{animation:flareBB .97s linear both}
.ring.armed .strip.t .comet{animation:cometT 5.5s linear infinite}.ring.armed .strip.r .comet{animation:cometR 5.5s linear infinite}
.ring.armed .strip.b .comet{animation:cometB 5.5s linear infinite}.ring.armed .strip.l .comet{animation:cometL 5.5s linear infinite}
.ring.armed .comet.two{animation-delay:-2.75s}
.ring.armed .halo{background:radial-gradient(closest-side,rgba(255,200,150,.42),rgba(245,144,52,.14) 55%,transparent);
  animation:spark .8s cubic-bezier(.2,.9,.3,1.3) both,haloPulse 2.4s ease-in-out .8s infinite}
.ring.armed .pool{animation:poolFlash .8s ease-out both}
@keyframes rise{from{opacity:0}to{opacity:1}}
@keyframes igniteFade{0%,60%{opacity:1}100%{opacity:0}}
@keyframes flareFade{0%,57%{opacity:1}72%,100%{opacity:0}}
@keyframes spark{0%{opacity:0;transform:translateX(-50%) scale(.2)}30%{opacity:1;transform:translateX(-50%) scale(1.25,1.7)}100%{opacity:.85;transform:translateX(-50%) scale(1)}}
@keyframes haloPulse{0%,100%{opacity:.85;transform:translateX(-50%) scale(1)}50%{opacity:1;transform:translateX(-50%) scale(1.12,1.35)}}
@keyframes poolFlash{0%{opacity:0;width:4vw}35%{opacity:1}100%{opacity:.9}}
@keyframes edgePulse{0%,100%{opacity:1}50%{opacity:.58}}
@keyframes bloomPulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes breathe{0%,100%{opacity:.62}50%{opacity:1}}
@keyframes travel{from{background-position:100% 0}to{background-position:-100% 0}}
@media (prefers-reduced-motion:reduce){.ring,.ring *{animation:none!important;transition:none!important}.strip{display:none}}
</style><style id="dyn"></style></head><body><div class="ring" id="ring"><div class="box" id="box">
<div class="edge"></div><div class="crown"></div><div class="side l"></div><div class="side r"></div><div class="halo"></div><div class="pool"></div>
${['t', 'r', 'b', 'l'].map((s) => ActivityPages._strip(s)).join('\n')}
</div></div>
<script>
(function(){var lock=null;var size='';var box=document.getElementById('box');var dyn=document.getElementById('dyn');
function kf(name,stops){return '@keyframes '+name+'{'+stops.map(function(s){return s[0].toFixed(3)+'%{transform:'+s[1]+'}';}).join('')+'}';}
function tx(x){return 'translateX('+x.toFixed(1)+'px)';}
// The motions depend on the box's size: the sweep and the comets keep one speed whatever the edges' lengths.
function build(){var W=box.clientWidth,H=box.clientHeight;var key=W+'x'+H;if(!W||!H||key===size)return;size=key;
var T=.55,D=.97,v=(W+H)/T,Lf=Math.max(90,Math.min(260,(W+H)*.05)),P=2*(W+H),Lc=Math.max(160,Math.min(700,Math.min(W,H)*.28));
box.style.setProperty('--W',W+'px');box.style.setProperty('--H',H+'px');box.style.setProperty('--Lf',Lf+'px');box.style.setProperty('--Lc',Lc+'px');
var pct=function(t){return Math.max(0,Math.min(100,t/D*100));};var css='';
var tTop=(W/2)/v,tSide=tTop+H/v;
var seg=function(name,t0,t1){css+=kf(name,[[0,'scaleX(0)'],[pct(t0),'scaleX(0)'],[pct(t1),'scaleX(1)'],[100,'scaleX(1)']]);};
seg('bodyT',0,tTop);seg('bodyS',tTop,tSide);seg('bodyB',tSide,T);
var fl=function(name,x0,dir){var x1=x0+dir*v*T;css+=kf(name,[[0,tx(x0)],[pct(T),tx(x1)],[100,tx(x1)]]);};
fl('flareTA',W/2-Lf,1);fl('flareTB',W/2,-1);fl('flareR',-W/2-Lf,1);fl('flareL',H+W/2,-1);fl('flareBA',-(W/2+H)-Lf,1);fl('flareBB',W+W/2+H,-1);
var lap=function(h){return h/P*100;};
var comet=function(name,s0,len){var end=s0+len+Lc;
if(end<=P){css+=kf(name,[[0,tx(-Lc)],[lap(s0),tx(-Lc)],[lap(end),tx(len)],[Math.min(100,lap(end)+.001),tx(-Lc)],[100,tx(-Lc)]]);}
else{var over=end-P;css+=kf(name,[[0,tx(len-Lc)],[lap(over),tx(len)],[lap(over)+.001,tx(-Lc)],[lap(s0),tx(-Lc)],[100,tx(len-Lc)]]);}};
comet('cometT',0,W);comet('cometR',W,H);comet('cometB',W+H,W);comet('cometL',2*W+H,H);
dyn.textContent=css;}
window.addEventListener('resize',build);
window.__ring={render:function(s){var r=document.getElementById('ring');s=s||{};
var cls='ring'+(s.on?' on':'')+(s.mode?' '+s.mode:'')+(s.framed?' framed':'');
box.style.inset=(s.framed&&s.inset)?s.inset.map(function(v){return v+'px';}).join(' '):'';
build();
// A new aim (another window, or back to the monitor) replays the ignition.
if(s.mode==='armed'&&s.lock!==lock&&lock!==null){r.className=cls.replace(' armed','');void r.offsetWidth;}
lock=s.mode==='armed'?s.lock:null;
r.className=cls;return true;}};})();
</script></body></html>`;
  }

  static _strip(side) {
    const parts = { t: ['tA', 'tB'], r: ['r'], b: ['bA', 'bB'], l: ['l'] }[side];
    const rev = new Set(['tB', 'l', 'bB']);
    const bodies = parts.map((p) => `<div class="body ${p}"></div>`).join('');
    const flares = parts.map((p) => `<div class="flare ${p}${rev.has(p) ? ' rev' : ''}"></div>`).join('');
    const comet = '<div class="comet"><i class="bloom"></i><i class="line"></i></div>';
    return `<div class="strip ${side}"><div class="g ignite">${bodies}</div><div class="g flares">${flares}</div><div class="g comets">${comet}${comet.replace('"comet"', '"comet two"')}</div></div>`;
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
.chip.nokey{padding-left:10px}
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
c.className='chip'+(key.disabled?' off':'')+(key.key?'':' nokey');c.style.setProperty('--i',i);if(key.disabled)c.setAttribute('aria-disabled','true');
c.innerHTML=(key.key?'<kbd>'+esc(key.key)+'</kbd>':'')+'<span>'+esc(key.label)+'</span>';
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
