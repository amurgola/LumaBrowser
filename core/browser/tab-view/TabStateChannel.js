const TabHosts = require('./TabHosts');

class TabStateChannel {
  constructor(hosts, registry, faviconCache = null) {
    this._hosts = hosts;
    this._registry = registry;
    this._faviconCache = faviconCache;
  }

  send(channel, payload, hostId = TabHosts.MAIN_ID) {
    const win = this._hosts.liveWindowOf(hostId);
    if (!win) return;
    try {
      win.webContents.send(channel, payload);
    } catch (_) {}
  }

  sendForTab(entry, channel, payload) {
    this.send(channel, payload, entry.hostId);
  }

  broadcast(entry) {
    this.sendForTab(entry, 'tab:state', this.serialize(entry));
  }

  serialize(entry) {
    return {
      id: entry.id,
      openerTabId: entry.openerTabId == null ? null : entry.openerTabId,
      url: entry.url,
      title: entry.title,
      loading: entry.loading,
      silent: entry.silent,
      kind: entry.kind || 'user',
      pinned: !!entry.pinned,
      keepAlive: !!entry.keepAlive,
      hidden: !!entry.hidden,
      canGoBack: entry.canGoBack,
      canGoForward: entry.canGoForward,
      zoomLevel: entry.zoomLevel,
      active: this._registry.isActive(entry.id),
      windowId: entry.hostId,
      createdAt: entry.createdAt,
      lastNavigatedAt: entry.lastNavigatedAt,
      lastActivatedAt: entry.lastActivatedAt || null,
      historyLength: entry.history.length,
      favicon: this._faviconFor(entry),
      index: this._registry.indexOf(entry.id),
      errorPage: !!entry._errorPageFor,
    };
  }

  _faviconFor(entry) {
    const cached = this._faviconCache && this._faviconCache.getForUrl(entry.url);
    return cached || entry.favicon || null;
  }
}

module.exports = TabStateChannel;
