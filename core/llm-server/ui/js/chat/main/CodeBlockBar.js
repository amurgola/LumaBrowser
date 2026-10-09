import Dom from '../../dom/Dom.js';
import Clipboard from '../../dom/Clipboard.js';

export default class CodeBlockBar {
  constructor(ctx) {
    this._ctx = ctx;
    this._bar = null;
    this._pre = null;
  }

  install() {
    this._bar = Dom.el('div', 'cm-codebar');
    this._bar.hidden = true;
    this._bar.innerHTML = '<button type="button" data-cb="copy">Copy</button>'
      + '<button type="button" data-cb="insert" title="Insert at the caret in the editor">Insert</button>';
    document.body.appendChild(this._bar);
    const scroll = this._ctx.els.scroll;
    scroll.addEventListener('mouseover', (e) => this._onOver(e));
    scroll.addEventListener('mouseout', (e) => { if (this._pre && !this._inside(e.relatedTarget)) this.hide(); });
    this._bar.addEventListener('mouseleave', (e) => { if (!this._inside(e.relatedTarget)) this.hide(); });
    scroll.addEventListener('scroll', () => this.hide());
    this._bar.addEventListener('click', (e) => this._onClick(e));
  }

  hide() {
    if (!this._bar) return;
    this._bar.hidden = true;
    this._pre = null;
  }

  _inside(node) {
    return !!node && ((this._pre && this._pre.contains(node)) || this._bar.contains(node));
  }

  _onOver(e) {
    const pre = e.target.closest ? e.target.closest('.cm-asst-body pre') : null;
    if (!pre || pre === this._pre) return;
    this._pre = pre;
    this._bar.querySelector('[data-cb="insert"]').hidden = !this._ctx.codeEditorDocked();
    const r = pre.getBoundingClientRect();
    this._bar.style.top = (Math.max(r.top, this._ctx.els.scroll.getBoundingClientRect().top) + 6) + 'px';
    this._bar.style.right = (window.innerWidth - r.right + 6) + 'px';
    this._bar.hidden = false;
  }

  async _onClick(e) {
    const btn = e.target.closest('[data-cb]');
    if (!btn || !this._pre) return;
    const text = this._pre.textContent || '';
    if (btn.dataset.cb === 'insert') {
      const ce = this._ctx.codeEditor();
      if (ce && ce.insertAtCaret) ce.insertAtCaret(text);
      return;
    }
    const ok = await Clipboard.copyText(text);
    btn.textContent = ok ? 'Copied' : 'Copy failed';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
  }
}
