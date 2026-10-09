import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import PageDom from './PageDom.js';
import PageIcons from './PageIcons.js';
import ContextChips from './ContextChips.js';

export default class Transcript {
  static STICK_DISTANCE_PX = 40;

  constructor(el, grammar) {
    this._el = el;
    this._grammar = grammar;
    this._stickToBottom = true;
    this._scrollQueued = false;
    this.status = null;
    el.scroller.addEventListener('scroll', () => this._trackScroll());
  }

  push(node) {
    this._el.transcript.appendChild(node);
    this.autoscroll();
    return node;
  }

  autoscroll() {
    if (!this._stickToBottom || this._scrollQueued) return;
    this._scrollQueued = true;
    requestAnimationFrame(() => {
      this._scrollQueued = false;
      this._el.scroller.scrollTop = this._el.scroller.scrollHeight;
    });
  }

  hasBlocks() {
    return this._el.transcript.childElementCount > 0;
  }

  clear() {
    this._el.transcript.innerHTML = '';
    this._el.live.innerHTML = '';
  }

  user(text, context) {
    const d = PageDom.div('block user');
    d.textContent = text;
    if (context && context.length) d.appendChild(this._contextLine(context));
    return this.push(d);
  }

  error(message) {
    return this.push(PageDom.div('block errblock', HtmlEscaper.escapeKeepingApostrophes(message || 'unknown error')));
  }

  note(text, level) {
    return this.push(PageDom.div('block note' + (level ? ' ' + level : ''), HtmlEscaper.escapeKeepingApostrophes(text)));
  }

  artifact(title, type) {
    const esc = HtmlEscaper.escapeKeepingApostrophes;
    const label = esc(title || 'artifact') + (type ? ' <span class="l">(' + esc(type) + ')</span>' : '');
    this.push(PageDom.div('block', '<span class="artifact"><span class="g">' + PageIcons.ICONS.artifact + '</span>' + label + '</span>'));
  }

  summary({ aborted, iterations, tokens, secs, tps }) {
    const bits = [aborted ? 'stopped' : 'done'];
    if (iterations) bits.push(iterations + ' step' + (iterations === 1 ? '' : 's'));
    if (tokens) bits.push(this._grammar.fmtTokens(tokens) + ' tokens');
    if (tps) bits.push(tps.toFixed(0) + ' tok/s');
    if (secs != null) bits.push(secs.toFixed(1) + 's');
    const html = '<span class="g">' + PageIcons.ICONS.done + '</span>' + HtmlEscaper.escapeKeepingApostrophes(bits.join(' · '));
    this.push(PageDom.div('block summary' + (aborted ? ' stopped' : ''), html));
  }

  setStatus(text) {
    this.status = text || null;
    this._el.live.innerHTML = text
      ? '<span class="status"><span class="spin"></span>' + HtmlEscaper.escapeKeepingApostrophes(text) + '</span>'
      : '';
    this.autoscroll();
  }

  _trackScroll() {
    const s = this._el.scroller;
    this._stickToBottom = s.scrollHeight - s.scrollTop - s.clientHeight < Transcript.STICK_DISTANCE_PX;
  }

  _contextLine(context) {
    const c = document.createElement('span');
    c.className = 'ctx';
    c.textContent = context.map((i) => ContextChips.label(i)).join('  ');
    return c;
  }
}
