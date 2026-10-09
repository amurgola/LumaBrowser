export default class LiteHistoryList {
  static render(listEl, conversations, activeId, onOpen) {
    if (!listEl) return;
    listEl.textContent = '';
    if (!conversations.length) {
      listEl.appendChild(LiteHistoryList._empty());
      return;
    }
    for (const conv of conversations) listEl.appendChild(LiteHistoryList._item(conv, conv.id === activeId, onOpen));
  }

  static _empty() {
    const empty = document.createElement('div');
    empty.className = 'ai-history-empty';
    empty.textContent = 'No conversations yet.';
    return empty;
  }

  static _item(conv, active, onOpen) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'ai-history-item' + (active ? ' active' : '');
    item.appendChild(LiteHistoryList._span('ai-history-title', conv.title || 'New chat'));
    item.appendChild(LiteHistoryList._span('ai-history-meta', LiteHistoryList._time(conv.updatedAt)));
    item.title = conv.title || 'New chat';
    item.addEventListener('click', () => onOpen(conv.id));
    return item;
  }

  static _span(className, text) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
  }

  static _time(updatedAt) {
    return updatedAt ? new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  }
}
