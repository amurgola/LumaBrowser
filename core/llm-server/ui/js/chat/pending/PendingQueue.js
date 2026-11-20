export default class PendingQueue {
  constructor() {
    this._byConversation = new Map();
    this._held = new Set();
    this._nextId = 1;
  }

  add(conversationId, staged) {
    const item = { id: 'q' + this._nextId, ...staged };
    this._nextId += 1;
    this._byConversation.set(conversationId, [...this.list(conversationId), item]);
    return item;
  }

  list(conversationId) {
    return this._byConversation.get(conversationId) || [];
  }

  remove(conversationId, itemId) {
    const items = this.list(conversationId);
    const item = items.find((queued) => queued.id === itemId) || null;
    if (item) this._keep(conversationId, items.filter((queued) => queued !== item));
    return item;
  }

  shift(conversationId) {
    const [first, ...rest] = this.list(conversationId);
    if (!first) return null;
    this._keep(conversationId, rest);
    return first;
  }

  hold(conversationId) {
    this._held.add(conversationId);
  }

  release(conversationId) {
    this._held.delete(conversationId);
  }

  isHeld(conversationId) {
    return this._held.has(conversationId);
  }

  _keep(conversationId, items) {
    if (items.length) this._byConversation.set(conversationId, items);
    else this._byConversation.delete(conversationId);
  }
}
