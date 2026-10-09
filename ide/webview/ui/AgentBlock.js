import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import PageDom from './PageDom.js';
import PageIcons from './PageIcons.js';

export default class AgentBlock {
  constructor(transcript, grammar, name) {
    this._grammar = grammar;
    this.done = false;
    this.chars = 0;
    this.tools = 0;
    this.startedAt = Date.now();
    this.node = transcript.push(PageDom.div('block tool run'));
    const row = PageDom.div('row');
    this._glyph = PageDom.div('g', '<span class="spin"></span>');
    const title = PageDom.div('t', '<b>Agent</b> <span class="d">' + HtmlEscaper.escapeKeepingApostrophes(name || 'agent') + '</span>');
    this._summary = PageDom.div('s');
    row.append(this._glyph, title, this._summary);
    this.node.appendChild(row);
  }

  paint() {
    const bits = [];
    if (this.tools) bits.push(this.tools + ' tool' + (this.tools === 1 ? '' : 's'));
    if (this.chars) bits.push(this._grammar.fmtTokens(this.chars) + ' chars');
    this._summary.textContent = bits.length ? '· ' + bits.join(' · ') : '';
  }

  finish(error) {
    this.done = true;
    this.node.classList.remove('run');
    this.node.classList.add('done', error ? 'err' : 'ok');
    this._glyph.innerHTML = error ? PageIcons.ICONS.fail : PageIcons.ICONS.ok;
    if (error) this._summary.textContent = '· ' + this._grammar.short(error, 80);
    else this.paint();
  }
}
