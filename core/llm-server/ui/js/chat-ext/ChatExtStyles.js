export default class ChatExtStyles {
  static ID = 'cm-ext-styles';

  static CSS = `
      /* Schema-form layout (scoped by .cm-schema on the card so other
         .luma-modal users keep their compact spacing). A 2-col grid gives the
         form its vertical rhythm; fields span both columns unless the schema
         marks them half-width (field.half) to pair related settings. */
      .cm-schema .luma-modal-head{padding:var(--space-5) var(--space-6) 0;}
      .cm-schema .luma-modal-title{font-size:var(--text-lg);font-weight:var(--weight-semibold);}
      .cm-schema .luma-modal-sub{line-height:var(--leading);max-width:64ch;margin-top:var(--space-1);}
      .cm-schema .luma-modal-body{display:grid;grid-template-columns:1fr 1fr;column-gap:var(--space-4);row-gap:var(--space-5);
        padding:var(--space-5) var(--space-6) var(--space-6);align-items:start;}
      .cm-schema .luma-modal-body > *{grid-column:1 / -1;min-width:0;}
      .cm-schema .luma-modal-body > .cm-x-half{grid-column:auto;align-self:stretch;}
      /* Bottom-align a half-row pair's inputs when one hint wraps longer. */
      .cm-schema .cm-x-half > select, .cm-schema .cm-x-half > input{margin-top:auto;}
      .cm-schema .luma-field > label{display:flex;align-items:center;gap:var(--space-2);min-height:24px;
        color:var(--text-primary);font-size:var(--text-md);font-weight:var(--weight-medium);}
      .cm-schema .luma-field > button.luma-btn{align-self:flex-start;}
      .cm-schema .luma-field input[type="number"]{max-width:180px;}
      .cm-schema .luma-modal-foot{padding:var(--space-4) var(--space-6) var(--space-5);border-top:1px solid var(--border-soft);}
      .cm-xhint{font-weight:var(--weight-regular);color:var(--text-secondary);font-size:var(--text-sm);line-height:var(--leading);margin:0;}
      /* Groups and repeaters are titled sections divided by a hairline, not
         boxes; only a repeater item gets a hairline box (never a box in a box). */
      .cm-xgroup{border:0;border-top:1px solid var(--border-soft);border-radius:0;padding:var(--space-4) 0 0;margin:0;
        display:flex;flex-direction:column;gap:var(--space-3);}
      .cm-xgroup > .cm-xgroup-title{font-weight:var(--weight-semibold);font-size:var(--text-md);margin:0;padding:0;}
      .cm-xrep{border:0;border-top:1px solid var(--border-soft);border-radius:0;padding:var(--space-4) 0 0;}
      .cm-xrep-list{display:flex;flex-direction:column;gap:var(--space-3);}
      .cm-xrep-item{border:1px solid var(--border-soft);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4) var(--space-4);
        margin:0;position:relative;display:flex;flex-direction:column;gap:var(--space-3);}
      .cm-xrep-item .cm-xgroup{border-top:0;padding-top:0;}
      .cm-xrep-item > .cm-xgroup-title{margin:0;padding:0;font-weight:var(--weight-semibold);font-size:var(--text-md);}
      .cm-xrep-item .cm-xrep-rm{position:absolute;top:var(--space-2);right:var(--space-2);height:24px;padding:0 var(--space-2);
        background:transparent;border:0;border-radius:var(--radius-md);color:var(--text-secondary);cursor:pointer;
        font:inherit;font-size:var(--text-sm);
        transition:background-color var(--dur-fast) var(--ease),color var(--dur-fast) var(--ease);}
      .cm-xrep-item .cm-xrep-rm:hover{background:var(--danger-dim);color:var(--danger);}
      .cm-xrep-actions{display:flex;gap:var(--space-2);flex-wrap:wrap;align-self:flex-start;}
      .cm-xrep-add{display:inline-flex;align-items:center;gap:var(--space-2);height:28px;padding:0 var(--space-3);
        background:var(--bg-surface-2);border:1px solid var(--border-soft);color:var(--text-primary);
        border-radius:var(--radius-md);cursor:pointer;font:inherit;font-size:var(--text-md);font-weight:var(--weight-medium);
        transition:background-color var(--dur-fast) var(--ease);}
      .cm-xrep-add:hover{background:var(--bg-elevated);}
      .cm-xrep-add > svg{width:14px;height:14px;flex:0 0 auto;}
      .cm-xrep-add:disabled{opacity:.6;cursor:default;}
      .cm-xrep-add:focus-visible,.cm-xrep-rm:focus-visible,.cm-xassist:focus-visible,.cm-charart-re:focus-visible{
        outline:none;box-shadow:var(--focus-ring);}
      .cm-ximg{display:flex;gap:var(--space-3);align-items:flex-start;}
      .cm-ximg-prev{width:96px;height:96px;border-radius:var(--radius-lg);object-fit:cover;background:var(--bg-surface-2);
        border:1px solid var(--border-soft);flex:0 0 auto;}
      .cm-ximg-actions{display:flex;flex-direction:column;gap:var(--space-2);}
      .cm-charart-base{display:flex;gap:var(--space-3);align-items:flex-start;}
      .cm-charart-img{width:120px;height:120px;border-radius:var(--radius-lg);object-fit:cover;
        background:var(--bg-surface-2);border:1px solid var(--border-soft);flex:0 0 auto;}
      .cm-charart-sec{margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid var(--border-soft);}
      .cm-charart-sec-head{display:flex;align-items:center;justify-content:space-between;gap:var(--space-2);margin-bottom:var(--space-2);}
      .cm-charart-sec-title{font-size:var(--text-md);font-weight:var(--weight-semibold);color:var(--text-primary);}
      .cm-charart-lock{font-size:var(--text-sm);color:var(--text-secondary);padding:var(--space-1) 0;}
      .cm-charart-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-2);margin-top:var(--space-3);}
      .cm-charart-cell{position:relative;display:flex;flex-direction:column;align-items:center;gap:var(--space-1);}
      .cm-charart-thumb{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:var(--radius-lg);
        background:var(--bg-surface-2);border:1px solid var(--border-soft);}
      .cm-charart-thumb.tall{aspect-ratio:2/3;}
      .cm-charart-cap{font-size:var(--text-xs);color:var(--text-secondary);}
      /* Regenerate (a small text button) sits top right of the thumbnail,
         Remove (an x icon) top left so the two never overlap. */
      .cm-charart-re{position:absolute;top:var(--space-1);right:var(--space-1);height:22px;padding:0 var(--space-2);
        display:inline-flex;align-items:center;justify-content:center;
        border:1px solid var(--border-strong);border-radius:var(--radius-md);background:var(--surface-pop);
        color:var(--text-primary);cursor:pointer;font:inherit;font-size:var(--text-xs);font-weight:var(--weight-medium);line-height:1;
        transition:background-color var(--dur-fast) var(--ease),color var(--dur-fast) var(--ease);}
      .cm-charart-re:hover{background:var(--bg-elevated);}
      .cm-charart-re:disabled{opacity:.6;cursor:default;}
      .cm-charart-del{right:auto;left:var(--space-1);width:22px;padding:0;}
      .cm-charart-del svg{width:12px;height:12px;}
      .cm-charart-del:hover{color:var(--danger);}
      /* AI-fill field: the box owns the border; the sparkles icon sits in its
         own rail at the top right (outside the text's scrollbar and free of
         the resize grip). While a draft streams in, the box locks, its border
         holds the accent (as when focused) and the icon becomes a stop button. */
      .cm-xassist-wrap{position:relative;display:flex;align-items:stretch;background:var(--surface-input);
        border:1px solid var(--border-strong);border-radius:var(--radius-md);
        transition:border-color var(--dur-fast) var(--ease);}
      .cm-xassist-wrap:focus-within,.cm-xassist-wrap.streaming{border-color:var(--accent);}
      .luma-field .cm-xassist-wrap > textarea,.luma-field .cm-xassist-wrap > input{
        flex:1;min-width:0;background:transparent;border:0;outline:none;box-shadow:none;resize:none;}
      .cm-xassist-wrap > textarea{min-height:96px;}
      .cm-xassist-rail{flex:0 0 auto;display:flex;align-items:flex-start;padding:var(--space-1);}
      .cm-xassist-wrap--area .cm-xassist-rail{align-self:flex-start;}
      .cm-xassist{display:inline-flex;align-items:center;justify-content:center;
        width:24px;height:24px;border-radius:var(--radius-md);border:0;background:transparent;
        color:var(--text-secondary);cursor:pointer;padding:0;z-index:1;
        transition:background-color var(--dur-fast) var(--ease),color var(--dur-fast) var(--ease);}
      .cm-xassist:hover{color:var(--text-primary);background:var(--surface-active);}
      .cm-xassist:disabled{opacity:.55;cursor:default;}
      .cm-xassist-wrap.streaming .cm-xassist{color:var(--text-primary);}
      .cm-xassist-ico{display:inline-flex;line-height:0;}
      .cm-xassist-ico svg{width:14px;height:14px;}
      /* Busy: the assist is building its prompt (real work), so the icon fades in and out. */
      .cm-xassist.busy .cm-xassist-ico,.cm-xassist-add.busy .cm-xassist-ico{animation:cm-xassist-pulse 1.1s var(--ease) infinite;}
      .cm-xassist-add .cm-xassist-ico{flex:0 0 auto;}
      .cm-xassist-status{font-size:var(--text-sm);color:var(--text-secondary);margin:0;}
      .cm-xassist-status:empty{display:none;}
      @keyframes cm-xassist-pulse{0%,100%{opacity:1}50%{opacity:.4}}
      @media (prefers-reduced-motion: reduce){
        .cm-xassist.busy .cm-xassist-ico,.cm-xassist-add.busy .cm-xassist-ico{animation:none;}
      }
    `;

  static ensure(doc = document) {
    if (doc.getElementById(ChatExtStyles.ID)) return;
    const style = doc.createElement('style');
    style.id = ChatExtStyles.ID;
    style.textContent = ChatExtStyles.CSS;
    doc.head.appendChild(style);
  }
}
