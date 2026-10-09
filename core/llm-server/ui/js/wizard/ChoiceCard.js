import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';

export default class ChoiceCard {
  static button(className, html, onClick) {
    const card = Dom.el('button', className, html);
    card.type = 'button';
    card.addEventListener('click', onClick);
    return card;
  }

  static titleDesc(title, desc) {
    return '<b>' + HtmlEscaper.escape(title) + '</b><span>' + HtmlEscaper.escape(desc) + '</span>';
  }
}
