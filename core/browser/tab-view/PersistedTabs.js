const PersistedTabList = require('./PersistedTabList');
const TabRegistry = require('./TabRegistry');
const CrashTracer = require('../../diagnostics/CrashTracer');

class PersistedTabs {
  constructor({ db, registry, channel, createTab, destroyTab }) {
    this._list = db ? new PersistedTabList(db) : null;
    this._registry = registry;
    this._channel = channel;
    this._createTab = createTab;
    this._destroyTab = destroyTab;
    this.reservedPartitions = new Set(this._storedItems().map((item) => item.partition).filter(Boolean));
  }

  reserve(partition) {
    this.reservedPartitions.add(partition);
  }

  save() {
    if (!this._list) return;
    try {
      this._list.write(this._registry.persisted());
    } catch (err) {
      console.warn('[TabViewManager] failed to save persisted tabs:', err && err.message);
    }
  }

  forget(entry) {
    this.reservedPartitions.delete(entry.partition);
    this.save();
  }

  setPersistence(tabId, persist) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    if (!entry.isRegularBrowsing()) return { success: false, error: 'Only regular browsing tabs can be persisted' };
    this._applyPersistence(entry, !!persist);
    if (!entry.keepAlive && entry.hidden) return this._destroyTab(tabId);
    this._channel.broadcast(entry);
    return { success: true, keepAlive: entry.keepAlive };
  }

  list() {
    return this._registry.persisted().map((entry) => this._channel.serialize(entry));
  }

  restore() {
    if (!this._list) return 0;
    const items = this._storedItems();
    CrashTracer.mark('persisted:restore-start', { count: items.length });
    const restored = items.filter((item) => this._restoreOne(item)).length;
    CrashTracer.mark('persisted:restore-end', { restored });
    return restored;
  }

  revive(entry) {
    const { url, partition, title, hidden } = entry;
    CrashTracer.mark('persisted:revive', { id: entry.id, hidden, url: String(url).slice(0, 120) });
    this._destroyTab(entry.id);
    const revived = this._createTab(url, { partition, keepAlive: true, hidden, activate: false, title });
    this.save();
    return revived;
  }

  _applyPersistence(entry, persist) {
    entry.keepAlive = persist;
    if (persist) this.reservedPartitions.add(entry.partition);
    else this.reservedPartitions.delete(entry.partition);
    this.save();
  }

  _storedItems() {
    if (!this._list) return [];
    return this._list.read();
  }

  _restoreOne(item) {
    if (!item.url || !item.partition) return false;
    if (this._isLive(item)) return false;
    this.reservedPartitions.add(item.partition);
    this._createTab(item.url, { partition: item.partition, keepAlive: true, hidden: true, activate: false, title: item.title });
    return true;
  }

  _isLive(item) {
    return this._registry.persisted().some((entry) => entry.partition === item.partition && entry.url === item.url);
  }
}

module.exports = PersistedTabs;
