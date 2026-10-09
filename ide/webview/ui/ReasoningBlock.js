import PageDom from './PageDom.js';
import PageIcons from './PageIcons.js';

export default class ReasoningBlock {
  constructor(transcript, open) {
    this._transcript = transcript;
    this._text = '';
    this._startedAt = Date.now();
    this.node = transcript.push(PageDom.div('block reasoning' + (open ? ' open' : '')));
    this._head = PageDom.div('rh', PageIcons.ICONS.chevron + '<span>thinking…</span>');
    this._body = PageDom.div('rb');
    this.node.append(this._head, this._body);
    this._head.addEventListener('click', () => this.node.classList.toggle('open'));
  }

  get text() {
    return this._text;
  }

  set text(value) {
    this._text = value;
    this._body.textContent = value;
    if (this.node.classList.contains('open')) this._transcript.autoscroll();
  }

  get chars() {
    return this._text.length;
  }

  seal() {
    if (!this._text.trim()) {
      this.node.remove();
      return;
    }
    const secs = Math.max(0.1, (Date.now() - this._startedAt) / 1000);
    this._head.querySelector('span').textContent = 'thought for ' + secs.toFixed(secs < 10 ? 1 : 0) + 's';
  }
}
