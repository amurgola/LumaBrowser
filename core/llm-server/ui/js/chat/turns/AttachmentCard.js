import ChatIcons from '../ChatIcons.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import CodeHighlighter from '../../markdown/CodeHighlighter.js';

export default class AttachmentCard {
  static create(att) {
    const headHtml = ChatIcons.paperclip
      + '<span class="cm-attach-name">' + HtmlEscaper.escape(att.name) + '</span>'
      + '<span class="cm-attach-meta">' + HtmlEscaper.escape(AttachmentCard.metaText(att)) + '</span>';
    if (att.kind !== 'file') return AttachmentCard._static(att, headHtml);
    return AttachmentCard._expandable(att, headHtml);
  }

  static metaText(att) {
    if (att.kind === 'failed') return 'failed' + (att.meta ? ': ' + att.meta : '');
    if (att.kind === 'binary') return att.meta ? att.meta + ' · not embedded' : 'not embedded';
    return att.meta || '';
  }

  static _static(att, headHtml) {
    const chip = Dom.el('div', 'cm-attach-card cm-attach-static' + (att.kind === 'failed' ? ' cm-attach-failed' : ''));
    chip.innerHTML = '<span class="cm-attach-head">' + headHtml + '</span>';
    return chip;
  }

  static _expandable(att, headHtml) {
    const card = Dom.el('details', 'cm-attach-card');
    const head = Dom.el('summary', 'cm-attach-head', headHtml + '<span class="cm-attach-chev">' + ChatIcons.chevron + '</span>');
    const body = Dom.el('div', 'cm-attach-body');
    card.appendChild(head);
    card.appendChild(body);
    card.addEventListener('toggle', () => {
      if (!card.open || body.dataset.filled) return;
      body.dataset.filled = '1';
      body.innerHTML = '<pre><code>' + CodeHighlighter.highlight(att.content) + '</code></pre>';
    });
    return card;
  }
}
