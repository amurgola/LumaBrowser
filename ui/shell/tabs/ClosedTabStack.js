export default class ClosedTabStack {
  static LIMIT = 25;

  constructor() {
    this._items = [];
  }

  get size() {
    return this._items.length;
  }

  remember(entry) {
    if (!entry || (entry.kind || 'user') !== 'user' || !/^https?:\/\//i.test(entry.url || '')) return;
    this._items.push({ url: entry.url, title: entry.title });
    if (this._items.length > ClosedTabStack.LIMIT) this._items.shift();
  }

  pop() {
    return this._items.pop();
  }
}
