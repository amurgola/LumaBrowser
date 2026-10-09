export default class ChatExtStyles {
  static ID = 'cm-ext-styles';

  static CSS = `
      /* Schema-form layout (scoped by .cm-schema on the card so other
         .luma-modal users keep their compact spacing). A 2-col grid gives the
         form its vertical rhythm; fields span both columns unless the schema
         marks them half-width (field.half) to pair related settings. */
      .cm-schema .luma-modal-head{padding:20px 24px 0;}
      .cm-schema .luma-modal-title{font-size:16px;}
      .cm-schema .luma-modal-sub{line-height:1.55;max-width:64ch;margin-top:6px;}
      .cm-schema .luma-modal-body{display:grid;grid-template-columns:1fr 1fr;column-gap:16px;row-gap:20px;
        padding:20px 24px 24px;align-items:start;}
      .cm-schema .luma-modal-body > *{grid-column:1 / -1;min-width:0;}
      .cm-schema .luma-modal-body > .cm-x-half{grid-column:auto;align-self:stretch;}
      /* Bottom-align a half-row pair's inputs when one hint wraps longer. */
      .cm-schema .cm-x-half > select, .cm-schema .cm-x-half > input{margin-top:auto;}
      .cm-schema .luma-field > label{display:flex;align-items:center;gap:8px;min-height:24px;
        color:var(--text-dim);font-weight:600;}
      .cm-schema .luma-field > button.luma-btn{align-self:flex-start;}
      .cm-schema .luma-field input[type="number"]{max-width:180px;}
      .cm-schema .luma-modal-foot{padding:16px 24px 20px;border-top:1px solid var(--border);margin-top:2px;}
      .cm-xhint{font-weight:400;color:var(--text-muted);font-size:12px;line-height:1.5;margin:-2px 0 0;}
      .cm-xgroup{border:1px solid var(--border);border-radius:var(--radius-lg);padding:14px 16px 16px;margin:0;
        display:flex;flex-direction:column;gap:12px;}
      .cm-xgroup > .cm-xgroup-title{font-weight:600;font-size:13px;margin:0;}
      .cm-xrep{border:1px solid var(--border);border-radius:var(--radius-lg);padding:14px 16px 16px;}
      .cm-xrep-list{display:flex;flex-direction:column;gap:12px;}
      .cm-xrep-item{border:1px solid var(--border-strong);border-radius:var(--radius-lg);padding:12px 14px 14px;
        margin:0;position:relative;display:flex;flex-direction:column;gap:12px;}
      .cm-xrep-item > .cm-xgroup-title{margin:0;font-weight:600;font-size:13px;}
      .cm-xrep-item .cm-xrep-rm{position:absolute;top:8px;right:8px;background:rgba(248,113,113,.12);
        border:1px solid rgba(248,113,113,.3);color:var(--bad);border-radius:8px;padding:3px 9px;cursor:pointer;font-size:12px;}
      .cm-xrep-actions{display:flex;gap:10px;flex-wrap:wrap;align-self:flex-start;}
      .cm-xrep-add{background:var(--accent-soft);border:1px solid rgba(245,144,52,.4);color:var(--accent);
        border-radius:9px;padding:7px 14px;cursor:pointer;font-size:13px;}
      .cm-xrep-add:hover{background:rgba(245,144,52,.25);}
      .cm-ximg{display:flex;gap:12px;align-items:flex-start;}
      .cm-ximg-prev{width:96px;height:96px;border-radius:12px;object-fit:cover;background:var(--bg-card);
        border:1px solid var(--border-strong);flex:0 0 auto;}
      .cm-ximg-actions{display:flex;flex-direction:column;gap:8px;}
      .cm-charart-base{display:flex;gap:12px;align-items:flex-start;}
      .cm-charart-img{width:120px;height:120px;border-radius:12px;object-fit:cover;
        background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);flex:0 0 auto;}
      .cm-charart-sec{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08);}
      .cm-charart-sec-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;}
      .cm-charart-sec-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-dim,#8a95ad);}
      .cm-charart-lock{font-size:12px;color:var(--text-dim,#8a95ad);padding:8px 10px;border:1px dashed rgba(255,255,255,.14);border-radius:9px;}
      .cm-charart-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px;}
      .cm-charart-cell{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;}
      .cm-charart-thumb{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:9px;
        background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);}
      .cm-charart-thumb.tall{aspect-ratio:2/3;}
      .cm-charart-cap{font-size:11px;color:var(--text-dim,#8a95ad);}
      .cm-charart-re{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;
        border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.45);color:#fff;cursor:pointer;
        font-size:12px;line-height:1;padding:0;}
      .cm-charart-del{right:30px;background:rgba(120,30,30,.65);}
      .cm-charart-re:hover{background:rgba(245,144,52,.5);}
      /* AI-fill field: the box owns the border; the ✨ sits in its own
         segmented rail at the top right (outside the text's scrollbar and
         free of the resize grip). While a draft streams in, the box locks,
         a shimmer line runs around its edge, and the ✨ becomes a stop
         button. */
      .cm-xassist-wrap{position:relative;display:flex;align-items:stretch;background:var(--surface-input);
        border:1px solid var(--border-strong);border-radius:var(--radius-md);}
      .cm-xassist-wrap:focus-within{border-color:var(--accent);}
      .luma-field .cm-xassist-wrap > textarea,.luma-field .cm-xassist-wrap > input{
        flex:1;min-width:0;background:transparent;border:0;outline:none;box-shadow:none;resize:none;}
      .cm-xassist-wrap > textarea{min-height:96px;}
      .cm-xassist-rail{flex:0 0 auto;display:flex;align-items:flex-start;padding:5px;
        border-left:1px solid var(--border);background:rgba(255,255,255,.02);
        border-radius:0 var(--radius-md) var(--radius-md) 0;}
      /* Multi-line variant: the rail shrinks to a corner notch in the top
         right instead of a full-height bar (text simply never enters that
         column; the strip under the notch stays plain box background). */
      .cm-xassist-wrap--area .cm-xassist-rail{align-self:flex-start;
        border-bottom:1px solid var(--border);
        border-radius:0 var(--radius-md) 0 10px;}
      .cm-xassist{display:inline-flex;align-items:center;justify-content:center;
        width:24px;height:24px;border-radius:7px;border:1px solid transparent;background:transparent;
        color:var(--accent);cursor:pointer;padding:0;opacity:.8;z-index:1;}
      .cm-xassist:hover{opacity:1;background:var(--accent-soft);border-color:rgba(245,144,52,.4);}
      .cm-xassist:disabled{opacity:.55;cursor:default;}
      .cm-xassist-ico{font-size:13px;line-height:1;}
      .cm-xassist.busy .cm-xassist-ico{animation:cm-xassist-pulse 1.1s ease-in-out infinite;}
      .cm-xassist-wrap.streaming::before{content:'';position:absolute;inset:-2px;padding:2px;
        border-radius:calc(var(--radius-md, 10px) + 2px);
        background:conic-gradient(from var(--cm-xa-angle), transparent 0 78%, var(--accent) 90%, transparent 100%);
        -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude;
        animation:cm-xa-rotate 1.4s linear infinite;pointer-events:none;}
      @media (prefers-reduced-motion: reduce){.cm-xassist-wrap.streaming::before{animation:none;background:var(--accent-soft);}}
      .cm-xassist-add{display:inline-flex;align-items:center;gap:7px;background:transparent;}
      .cm-xassist-add .cm-xassist-ico{flex:0 0 auto;}
      .cm-xassist-add.busy .cm-xassist-ico{animation:cm-xassist-pulse 1.1s ease-in-out infinite;}
      .cm-xassist-status{font-size:12px;color:var(--text-muted);margin:0;}
      .cm-xassist-status:empty{display:none;}
      @keyframes cm-xassist-pulse{0%,100%{opacity:1}50%{opacity:.35}}
      @property --cm-xa-angle{syntax:'<angle>';initial-value:0deg;inherits:false;}
      @keyframes cm-xa-rotate{to{--cm-xa-angle:360deg;}}
    `;

  static ensure(doc = document) {
    if (doc.getElementById(ChatExtStyles.ID)) return;
    const style = doc.createElement('style');
    style.id = ChatExtStyles.ID;
    style.textContent = ChatExtStyles.CSS;
    doc.head.appendChild(style);
  }
}
