import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import PageIcons from './PageIcons.js';
import PageDom from './PageDom.js';

export default class ContextChips {
  constructor(container, host) {
    this._container = container;
    this._host = host;
  }

  static label(item) {
    const name = item.path || 'selection';
    if (!item.startLine) return name;
    return name + ':' + item.startLine + (item.endLine && item.endLine !== item.startLine ? '-' + item.endLine : '');
  }

  paint(items) {
    this._container.innerHTML = '';
    for (const item of items) this._container.appendChild(this._chip(item));
  }

  _chip(item) {
    const c = PageDom.div('chip');
    const glyph = item.kind === 'selection' ? PageIcons.ICONS.code : PageIcons.ICONS.doc;
    c.innerHTML = '<span class="g">' + glyph + '</span><span class="n">' + HtmlEscaper.escapeKeepingApostrophes(ContextChips.label(item)) + '</span>';
    const x = document.createElement('button');
    x.innerHTML = PageIcons.ICONS.x;
    x.title = 'Remove';
    x.addEventListener('click', () => this._host.send('removeContext', { id: item.id }));
    c.appendChild(x);
    return c;
  }
}
