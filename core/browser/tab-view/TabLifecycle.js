const TabEntry = require('./TabEntry');
const TabKinds = require('./TabKinds');
const TabRegistry = require('./TabRegistry');
const TabViewFactory = require('./TabViewFactory');
const HiddenTabState = require('./HiddenTabState');
const TabUrl = require('../TabUrl');
const PermissionManager = require('../PermissionManager');
const CrashTracer = require('../../diagnostics/CrashTracer');

class TabLifecycle {
  static DEFAULT_START_PAGE = 'https://duckduckgo.com';
  static START_PAGE_KEY = 'startPageUrl';
  static DEFAULT_TITLE = 'New Tab';
  static RECENTLY_CLOSED_LIMIT = 25;

  constructor({ mainWindow, db, registry, channel, factory, activation, persisted, wireEvents, emitter }) {
    this._mainWindow = mainWindow;
    this._db = db;
    this._registry = registry;
    this._channel = channel;
    this._factory = factory;
    this._activation = activation;
    this._persisted = persisted;
    this._wireEvents = wireEvents;
    this._emitter = emitter;
    this.recentlyClosed = [];
  }

  create(url = TabLifecycle.DEFAULT_START_PAGE, options = {}) {
    const entry = this._buildEntry(url, options);
    this._register(entry, options.index);
    this._factory.attach(entry);
    this._wireEvents(entry);
    this._factory.attachServices(entry);
    this._announceCreated(entry);
    TabViewFactory.applyIdentity(entry);
    this._startLoading(entry, url);
    this._activateOrBroadcast(entry, options);
    return this._channel.serialize(entry);
  }

  close(tabId) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    if (entry.pinned) return { success: false, error: 'Cannot close a pinned tab' };
    this._keepStripNonEmpty(entry);
    this._rememberClosed(entry);
    return entry.keepAlive ? this.hide(tabId) : this.destroy(tabId);
  }

  reopenClosed() {
    const last = this.recentlyClosed.pop();
    if (!last) return { success: false, error: 'No recently closed tab' };
    return { success: true, tab: this.create(last.url, { activate: true, title: last.title }) };
  }

  move(tabId, toIndex) {
    const moved = this._registry.move(tabId, toIndex);
    if (!moved) return TabRegistry.notFound(tabId);
    const order = this._registry.order.slice();
    if (moved.from === moved.to) return { success: true, order };
    this._emitter.emit('tabMoved', tabId, moved.to);
    this._channel.send('tab:moved', { id: tabId, index: moved.to, order });
    return { success: true, order };
  }

  hide(tabId) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    const next = this._registry.isActive(tabId) ? this._registry.neighbourOf(tabId) : null;
    CrashTracer.mark('tab:hide', { id: tabId, active: this._registry.isActive(tabId) });
    this._markHidden(entry);
    this._handOffActive(tabId, next);
    this._emitter.emit('tabHidden', tabId);
    this._channel.send('tab:hidden', { id: tabId });
    return { success: true, hidden: true };
  }

  destroy(tabId) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    CrashTracer.mark('tab:destroy', { id: tabId, keepAlive: entry.keepAlive, hidden: entry.hidden, active: this._registry.isActive(tabId) });
    TabLifecycle._permissions((pm) => pm.onTabClosed(tabId));
    this._detachView(entry);
    const next = this._registry.isActive(tabId) ? this._registry.neighbourOf(tabId) : null;
    this._unregister(entry);
    this._handOffActive(tabId, next);
    this._emitter.emit('tabClosed', tabId);
    this._channel.send('tab:closed', { id: tabId });
    return { success: true };
  }

  destroyAll() {
    CrashTracer.mark('tab:destroyAll', { count: this._registry.tabs.size });
    for (const entry of this._registry.tabs.values()) this._detachView(entry);
    this._registry.clear();
  }

  static _permissions(action) {
    const pm = PermissionManager.current();
    if (pm) action(pm);
  }

  _buildEntry(url, options) {
    const kind = options.kind || TabKinds.DEFAULT;
    const silent = !!options.silent;
    const keepAlive = !!options.keepAlive;
    const partition = options.partition || TabKinds.SHARED_PARTITION;
    const view = this._factory.createView({ partition, preloadPath: options.preloadPath, silent, keepAlive });
    return new TabEntry({
      id: this._registry.allocateId(kind), view, partition, url, kind, silent, keepAlive,
      title: TabLifecycle._initialTitle(options.title), pinned: options.pinned, hidden: options.hidden,
      openerTabId: options.openerTabId,
    });
  }

  static _initialTitle(title) {
    return typeof title === 'string' && title.length > 0 ? title : TabLifecycle.DEFAULT_TITLE;
  }

  _register(entry, index) {
    this._registry.add(entry, index);
    if (entry.keepAlive) this._persisted.reserve(entry.partition);
    if (entry.hidden) HiddenTabState.syncAudio(entry);
  }

  _announceCreated(entry) {
    this._emitter.emit('viewAttached', entry.webContents, entry);
    this._emitter.emit('tabCreated', this._channel.serialize(entry));
  }

  _startLoading(entry, url) {
    entry.webContents.loadURL(TabUrl.normalize(url)).catch((err) => {
      if (/ERR_ABORTED/.test((err && err.message) || '')) return;
      console.warn(`[TabViewManager] loadURL failed for tab ${entry.id}:`, err.message);
    });
  }

  _activateOrBroadcast(entry, options) {
    const activate = options.activate !== false && !entry.silent && !entry.hidden;
    if (activate) this._activation.switchTo(entry.id);
    else this._channel.broadcast(entry);
  }

  _keepStripNonEmpty(entry) {
    if (!entry.isInStrip() || entry.isInternal()) return;
    const others = this._registry.inStrip().filter((tab) => tab.id !== entry.id && !tab.isInternal());
    if (others.length > 0) return;
    this.create(this._startPageUrl(), { activate: true, index: this._registry.indexOf(entry.id) + 1 });
  }

  _rememberClosed(entry) {
    if (!entry.isRegularBrowsing() || !entry.url) return;
    this.recentlyClosed.push({ url: entry.url, title: entry.title });
    if (this.recentlyClosed.length > TabLifecycle.RECENTLY_CLOSED_LIMIT) this.recentlyClosed.shift();
  }

  _startPageUrl() {
    try {
      const value = this._db ? this._db.get(TabLifecycle.START_PAGE_KEY, TabLifecycle.DEFAULT_START_PAGE) : TabLifecycle.DEFAULT_START_PAGE;
      return (typeof value === 'string' && value.trim()) || TabLifecycle.DEFAULT_START_PAGE;
    } catch (_) {
      return TabLifecycle.DEFAULT_START_PAGE;
    }
  }

  _markHidden(entry) {
    entry.hidden = true;
    TabLifecycle._permissions((pm) => pm.onTabHidden(entry.id));
    HiddenTabState.sync(entry);
    try { entry.view.setVisible(false); } catch (_) {}
  }

  _handOffActive(tabId, next) {
    if (!this._registry.isActive(tabId)) return;
    this._registry.activeTabId = null;
    if (next) this._activation.switchTo(next.id);
  }

  _detachView(entry) {
    try { this._mainWindow.contentView.removeChildView(entry.view); } catch (_) {}
    try { if (!entry.webContents.isDestroyed()) entry.webContents.close(); } catch (_) {}
  }

  _unregister(entry) {
    this._registry.remove(entry.id);
    if (entry.keepAlive) this._persisted.forget(entry);
  }
}

module.exports = TabLifecycle;
