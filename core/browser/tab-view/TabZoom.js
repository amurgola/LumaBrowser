const FaviconCache = require('../FaviconCache');

class TabZoom {
  static SETTING_KEY = 'zoomPerHost';
  static MIN = 0.3;
  static MAX = 3.0;
  static EPSILON = 0.005;

  constructor({ db, registry, channel }) {
    this._db = db;
    this._registry = registry;
    this._channel = channel;
  }

  set(tabId, zoomLevel) {
    const entry = this._registry.get(tabId);
    if (!entry) return { success: false };
    const factor = TabZoom._clamp(zoomLevel);
    TabZoom._applyFactor(entry, factor);
    this._remember(entry.url, factor);
    this._applyToSameHost(entry, factor);
    this._channel.broadcast(entry);
    return { success: true, zoomLevel: factor };
  }

  get(tabId) {
    const entry = this._registry.get(tabId);
    if (!entry) return { success: false, zoomLevel: 1 };
    let factor = entry.zoomLevel;
    try {
      if (typeof entry.webContents.getZoomFactor === 'function') factor = entry.webContents.getZoomFactor();
    } catch (_) {}
    entry.zoomLevel = factor;
    return { success: true, zoomLevel: factor };
  }

  by(tabId, step) {
    const current = this.get(tabId).zoomLevel || 1;
    return this.set(tabId, current + step);
  }

  applyStored(entry, url) {
    if (entry.isInternal() || entry.silent) return;
    const factor = this._storedFactor(FaviconCache.hostOf(url));
    if (Math.abs(factor - entry.zoomLevel) < TabZoom.EPSILON) return;
    entry.zoomLevel = factor;
    try { entry.webContents.setZoomFactor(factor); } catch (_) {}
  }

  static _clamp(zoomLevel) {
    const bounded = Math.min(TabZoom.MAX, Math.max(TabZoom.MIN, Number(zoomLevel) || 1));
    return Math.round(bounded * 100) / 100;
  }

  static _applyFactor(entry, factor) {
    entry.zoomLevel = factor;
    entry.webContents.setZoomFactor(factor);
  }

  _applyToSameHost(entry, factor) {
    const host = FaviconCache.hostOf(entry.url);
    if (!host) return;
    for (const other of this._registry.tabs.values()) {
      if (other === entry || other.isInternal() || FaviconCache.hostOf(other.url) !== host) continue;
      other.zoomLevel = factor;
      try { other.webContents.setZoomFactor(factor); } catch (_) {}
      this._channel.broadcast(other);
    }
  }

  _remember(url, factor) {
    const host = FaviconCache.hostOf(url);
    if (!this._db || !host) return;
    try {
      const map = Object.assign({}, this._db.get(TabZoom.SETTING_KEY, {}) || {});
      if (Math.abs(factor - 1) < TabZoom.EPSILON) delete map[host];
      else map[host] = factor;
      this._db.set(TabZoom.SETTING_KEY, map);
    } catch (_) {}
  }

  _storedFactor(host) {
    if (!host || !this._db) return 1;
    try {
      const map = this._db.get(TabZoom.SETTING_KEY, {}) || {};
      return typeof map[host] === 'number' ? map[host] : 1;
    } catch (_) {
      return 1;
    }
  }
}

module.exports = TabZoom;
