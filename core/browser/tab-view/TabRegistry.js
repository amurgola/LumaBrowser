const TabKinds = require('./TabKinds');

class TabRegistry {
  constructor() {
    this.tabs = new Map();
    this.order = [];
    this.activeTabId = null;
    this._nextTabId = 0;
    this._nextInternalTabId = TabKinds.INTERNAL_TAB_ID_BASE;
  }

  allocateId(kind) {
    return TabKinds.isInternal(kind) ? this._nextInternalTabId++ : this._nextTabId++;
  }

  add(entry, index) {
    this.tabs.set(entry.id, entry);
    this.order.splice(this._insertionIndex(index), 0, entry.id);
  }

  remove(tabId) {
    this.tabs.delete(tabId);
    const at = this.order.indexOf(tabId);
    if (at !== -1) this.order.splice(at, 1);
  }

  get(tabId) {
    return this.tabs.get(tabId) || null;
  }

  indexOf(tabId) {
    return this.order.indexOf(tabId);
  }

  entries() {
    return [...this.tabs.values()];
  }

  persisted() {
    return this.entries().filter((entry) => entry.keepAlive);
  }

  list({ includeSilent = false, includeInternal = false } = {}) {
    return this._ordered().filter((entry) => {
      if (!includeSilent && (entry.silent || entry.hidden)) return false;
      return includeInternal || !entry.isInternal();
    });
  }

  inStrip() {
    return this._ordered().filter((entry) => entry.isInStrip());
  }

  neighbourOf(tabId) {
    const visible = this.inStrip();
    const at = visible.findIndex((entry) => entry.id === tabId);
    if (at === -1) return visible[0] || null;
    return visible[at + 1] || visible[at - 1] || null;
  }

  move(tabId, toIndex) {
    const from = this.order.indexOf(tabId);
    if (from === -1) return null;
    const to = Math.max(0, Math.min(Number(toIndex) || 0, this.order.length - 1));
    if (from !== to) {
      this.order.splice(from, 1);
      this.order.splice(to, 0, tabId);
    }
    return { from, to };
  }

  findIdByWebContents(webContents) {
    for (const [id, entry] of this.tabs) {
      if (entry.webContents === webContents) return id;
    }
    return null;
  }

  isActive(tabId) {
    return this.activeTabId === tabId;
  }

  clear() {
    this.tabs.clear();
    this.order = [];
    this.activeTabId = null;
  }

  static notFound(tabId) {
    return { success: false, error: `Tab ${tabId} not found` };
  }

  _ordered() {
    return this.order.map((id) => this.tabs.get(id)).filter(Boolean);
  }

  _insertionIndex(index) {
    if (!Number.isInteger(index)) return this.order.length;
    return Math.max(0, Math.min(index, this.order.length));
  }
}

module.exports = TabRegistry;
