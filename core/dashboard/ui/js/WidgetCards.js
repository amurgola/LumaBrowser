import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';

export default class WidgetCards {
  static KIND_EXTENSION = 'extension';

  constructor(doc, handlers) {
    this._doc = doc;
    this._handlers = handlers;
  }

  static find(doc, rootId) {
    for (const el of doc.querySelectorAll('.db-card[data-root-id]')) {
      if (el.dataset.rootId === rootId) return el;
    }
    return null;
  }

  card(rootId, title, { kind } = {}) {
    const isExtension = kind === WidgetCards.KIND_EXTENSION;
    const wrap = this._shell();
    wrap.dataset.rootId = rootId;
    wrap.dataset.kind = isExtension ? WidgetCards.KIND_EXTENSION : 'live';
    wrap.innerHTML = isExtension ? WidgetCards._extensionCardHtml(title) : WidgetCards._cardHtml(title);
    this._wireCard(wrap, rootId, title, isExtension);
    return wrap;
  }

  tombstone() {
    const wrap = this._shell();
    wrap.innerHTML =
      '<div class="card-header db-card-head">'
      + '<span class="db-card-title">Missing module</span>'
      + '<button class="db-ghost db-remove" type="button">Remove</button>'
      + '</div>'
      + '<div class="db-tombstone">This widget\'s artifact was deleted. Remove the card, or rebuild the module in chat.</div>';
    wrap.querySelector('.db-remove').addEventListener('click', () => this._handlers.remove(wrap));
    wrap.dataset.tombstone = '1';
    return wrap;
  }

  _shell() {
    const wrap = this._doc.createElement('div');
    wrap.className = 'db-card grid-stack-item-content';
    return wrap;
  }

  _wireCard(wrap, rootId, title, isExtension) {
    const on = (selector, fn) => wrap.querySelector(selector).addEventListener('click', fn);
    on('.db-remove', () => this._handlers.remove(wrap));
    on('.db-reload', () => this._handlers.reload(rootId, wrap));
    if (isExtension) return;
    on('.db-chat', () => this._handlers.chat(rootId));
    on('.db-schedule', () => this._handlers.schedule(rootId, title));
  }

  static _cardHtml(title) {
    return '<div class="card-header db-card-head">'
      + '<span class="db-card-title">' + HtmlEscaper.escape(title || 'Live module') + '</span>'
      + '<span class="db-task-badge" hidden title="This widget refreshes on a schedule">Scheduled</span>'
      + '<button class="db-ghost db-schedule" type="button" title="Scheduled updates and run history">Schedule</button>'
      + '<button class="db-ghost db-reload" type="button" title="Reload this widget">Reload</button>'
      + '<button class="db-ghost db-chat" type="button" title="Open the conversation that built this widget">Chat</button>'
      + '<button class="db-ghost db-remove" type="button" title="Remove from dashboard">Remove</button>'
      + '</div>'
      + '<div class="db-card-body"><div class="cm-live-root"></div></div>';
  }

  static _extensionCardHtml(title) {
    return '<div class="card-header db-card-head">'
      + '<span class="db-card-title">' + HtmlEscaper.escape(title || 'Extension widget') + '</span>'
      + '<button class="db-ghost db-reload" type="button" title="Reload this widget">Reload</button>'
      + '<button class="db-ghost db-remove" type="button" title="Remove from dashboard">Remove</button>'
      + '</div>'
      + '<div class="db-card-body"><div class="cm-live-root"></div></div>';
  }
}
