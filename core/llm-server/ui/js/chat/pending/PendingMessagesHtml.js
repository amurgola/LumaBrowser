import ChatIcons from '../ChatIcons.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class PendingMessagesHtml {
  static WAITING = 'Sent one at a time, as soon as the model is free.';
  static HELD = 'On hold: the last reply stopped before it finished.';

  static build(items, { held = false, canSend = false } = {}) {
    if (!items.length) return '';
    return PendingMessagesHtml._head(items.length, held, canSend)
      + '<ol class="cm-pending-list">' + items.map((item) => PendingMessagesHtml.row(item)).join('') + '</ol>';
  }

  static row(item) {
    const esc = HtmlEscaper.escape;
    const id = esc(item.id);
    const extras = PendingMessagesHtml.extras(item);
    return `<li class="cm-pending-item" data-pending-id="${id}">`
      + `<span class="cm-pending-text">${esc(PendingMessagesHtml.label(item))}</span>`
      + (extras ? `<span class="cm-pending-extras">${esc(extras)}</span>` : '')
      + `<button class="cm-pending-btn" type="button" data-pending-edit="${id}" title="Edit: back to the reply box">${ChatIcons.edit}</button>`
      + `<button class="cm-pending-btn" type="button" data-pending-remove="${id}" title="Remove">${ChatIcons.x}</button>`
      + '</li>';
  }

  static label(item) {
    const text = String(item.text || '').replace(/\s+/g, ' ').trim();
    return text || 'Attachments only';
  }

  static extras(item) {
    const count = (Array.isArray(item.attachments) ? item.attachments.length : 0) + (Array.isArray(item.context) ? item.context.length : 0);
    if (!count) return '';
    return count + (count === 1 ? ' attachment' : ' attachments');
  }

  static _head(count, held, canSend) {
    const send = held ? `<button class="cm-pending-send" type="button" data-pending-send${canSend ? '' : ' disabled'}>Send next</button>` : '';
    return '<div class="cm-pending-head">'
      + `<span class="cm-pending-title">Queued (${count})</span>`
      + `<span class="cm-pending-note">${held ? PendingMessagesHtml.HELD : PendingMessagesHtml.WAITING}</span>`
      + send
      + '</div>';
  }
}
