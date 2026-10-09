import ThinkingText from './ThinkingText.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ThinkPane {
  static LIVE_MS = 1500;

  constructor(ctx) {
    this._ctx = ctx;
  }

  isThinkingNow(m) {
    const { state } = this._ctx;
    if (!m || m !== state.streamMsg || !state.streaming) return false;
    return (Date.now() - (m._reasonAt || 0)) < ThinkPane.LIVE_MS;
  }

  static create(text, open, streaming) {
    const d = Dom.el('div', 'cm-think' + (open ? ' open' : ''));
    const sum = Dom.el('button', 'cm-think-sum', HtmlEscaper.escape(ThinkingText.summary(text, streaming)));
    sum.addEventListener('click', () => d.classList.toggle('open'));
    const body = Dom.el('div', 'cm-think-body');
    body.textContent = text;
    d.appendChild(sum);
    d.appendChild(body);
    return d;
  }

  static update(pane, text, streaming) {
    pane.querySelector('.cm-think-body').textContent = text;
    const sum = pane.querySelector('.cm-think-sum');
    if (!sum) return;
    const s = ThinkingText.summary(text, streaming);
    if (sum.textContent !== s) sum.textContent = s;
  }

  static scrollToEnd(pane) {
    const b = pane && pane.querySelector('.cm-think-body');
    if (b) b.scrollTop = b.scrollHeight;
  }
}
