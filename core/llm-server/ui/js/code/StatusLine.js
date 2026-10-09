export default class StatusLine {
  static CLEAR_MS = 2600;

  constructor(element) {
    this._el = element;
  }

  show(message, kind) {
    if (!this._el) return;
    this._el.textContent = message || '';
    this._el.className = 'ce-status' + (kind ? ' ce-status--' + kind : '');
    if (!message || kind === 'error') return;
    setTimeout(() => { if (this._el.textContent === message) this.show(''); }, StatusLine.CLEAR_MS);
  }
}
