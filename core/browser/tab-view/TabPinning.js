const TabRegistry = require('./TabRegistry');

class TabPinning {
  constructor({ registry, channel, lifecycle, emitter }) {
    this._registry = registry;
    this._channel = channel;
    this._lifecycle = lifecycle;
    this._emitter = emitter;
  }

  static isFront(entry) {
    return !!(entry && (entry.pinned || entry.userPinned));
  }

  boundary(excludeId = null) {
    const ids = this._registry.order.filter((id) => id !== excludeId);
    let last = -1;
    ids.forEach((id, i) => { if (TabPinning.isFront(this._registry.get(id))) last = i; });
    return last + 1;
  }

  setPinned(tabId, pinned) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    if (!entry.isRegularBrowsing()) return { success: false, error: 'Only regular browsing tabs can be pinned' };
    const on = !!pinned;
    if (entry.userPinned !== on) {
      entry.userPinned = on;
      this._lifecycle.move(tabId, this.boundary(tabId));
    }
    this._channel.broadcast(entry);
    this._emitter.emit('tabPinned', tabId, on);
    return { success: true, pinned: on };
  }

  clampMove(tabId, toIndex) {
    const entry = this._registry.get(tabId);
    if (!entry || entry.pinned) return toIndex;
    const edge = this.boundary(tabId);
    const to = Number(toIndex) || 0;
    if (entry.userPinned) return Math.max(this._appPinnedEnd(tabId), Math.min(to, edge));
    return Math.max(to, edge);
  }

  _appPinnedEnd(excludeId) {
    const ids = this._registry.order.filter((id) => id !== excludeId);
    let last = -1;
    ids.forEach((id, i) => { const e = this._registry.get(id); if (e && e.pinned) last = i; });
    return last + 1;
  }
}

module.exports = TabPinning;
