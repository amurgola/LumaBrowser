const EventEmitter = require('events');
const DownloadManager = require('./DownloadManager');
const TabKinds = require('./tab-view/TabKinds');
const TabRegistry = require('./tab-view/TabRegistry');
const TabStateChannel = require('./tab-view/TabStateChannel');
const TabLayout = require('./tab-view/TabLayout');
const TabActivation = require('./tab-view/TabActivation');
const TabViewFactory = require('./tab-view/TabViewFactory');
const PersistedTabs = require('./tab-view/PersistedTabs');
const KeepAliveSweep = require('./tab-view/KeepAliveSweep');
const TabLifecycle = require('./tab-view/TabLifecycle');
const TabZoom = require('./tab-view/TabZoom');
const TabLoader = require('./tab-view/TabLoader');
const TabHistory = require('./tab-view/TabHistory');
const TabPageTools = require('./tab-view/TabPageTools');
const TabConsoleLog = require('./tab-view/TabConsoleLog');
const TabLoadEvents = require('./tab-view/TabLoadEvents');
const TabPageEvents = require('./tab-view/TabPageEvents');
const TabPopupHandler = require('./tab-view/TabPopupHandler');
const TabPermissionHook = require('./tab-view/TabPermissionHook');
const DataFileDownloadHook = require('./tab-view/DataFileDownloadHook');
const TabAcceleratorActions = require('./tab-view/TabAcceleratorActions');
const TabNotificationRelay = require('./tab-view/TabNotificationRelay');
const TabSessionCache = require('./tab-view/TabSessionCache');
const TabViewIpcController = require('./tab-view/TabViewIpcController');

class TabViewManager extends EventEmitter {
  static SHARED_PARTITION = TabKinds.SHARED_PARTITION;
  static AUTOMATION_KINDS = TabKinds.AUTOMATION;
  static INTERNAL_KINDS = TabKinds.INTERNAL;

  constructor(mainWindow, { preloadPath, networkInterceptor, chromeExtensionService, adblockerService, db, faviconCache } = {}) {
    super();
    this._setupSharedVariablesFromParameters(mainWindow, { preloadPath, networkInterceptor, chromeExtensionService, adblockerService, db, faviconCache });
    this._buildTabState();
    this._buildTabBehaviour();
    this._buildPageEvents();
    this._relayDownloads();
    TabViewIpcController.register(this, this._notifications);
  }


  get tabs() { return this._registry.tabs; }

  get order() { return this._registry.order; }

  get activeTabId() { return this._registry.activeTabId; }

  get currentBounds() { return this._layout.currentBounds; }

  get recentlyClosed() { return this._lifecycle.recentlyClosed; }

  get reservedPartitions() { return this._persisted.reservedPartitions; }


  createTab(url, options = {}) { return this._lifecycle.create(url, options); }

  closeTab(tabId) { return this._lifecycle.close(tabId); }

  closeTabInternal(tabId) { return this._lifecycle.destroy(tabId); }

  reopenClosedTab() { return this._lifecycle.reopenClosed(); }

  moveTab(tabId, toIndex) { return this._lifecycle.move(tabId, toIndex); }

  switchToTab(tabId) { return this._activation.switchTo(tabId); }

  showTab(tabId) {
    if (!this._registry.get(tabId)) return TabRegistry.notFound(tabId);
    return this._activation.switchTo(tabId);
  }

  cycleTab(delta) { return this._activation.cycle(delta); }

  selectTabByIndex(n) { return this._activation.selectByIndex(n); }

  setBounds(bounds) { this._layout.setBounds(bounds); }

  destroyAll() {
    this.stopKeepAliveSweep();
    this._lifecycle.destroyAll();
  }


  setTabPersistence(tabId, persist) { return this._persisted.setPersistence(tabId, persist); }

  getPersistedTabs() { return this._persisted.list(); }

  restorePersistedTabs() { return this._persisted.restore(); }

  startKeepAliveSweep(options = {}) { this._keepAlive.start(() => this.activatePersistedTabs(), options); }

  stopKeepAliveSweep() { this._keepAlive.stop(); }

  activatePersistedTabs() { return this._keepAlive.activateAll(); }


  navigate(tabId, url) { return this._loader.navigate(tabId, url); }

  waitForLoad(tabId, timeoutMs) { return this._loader.waitForLoad(tabId, timeoutMs); }

  reload(tabId, options = {}) { return this._loader.reload(tabId, options); }

  stop(tabId) { return this._loader.stop(tabId); }

  goBack(tabId) { return this._history.goBack(tabId); }

  goForward(tabId) { return this._history.goForward(tabId); }

  getHistory(tabId) { return this._history.list(tabId); }

  goToIndex(tabId, index) { return this._history.goToIndex(tabId, index); }

  setZoom(tabId, zoomLevel) { return this._zoom.set(tabId, zoomLevel); }

  getZoom(tabId) { return this._zoom.get(tabId); }

  zoomBy(tabId, step) { return this._zoom.by(tabId, step); }

  findInPage(tabId, text, options = {}) { return this._pageTools.findInPage(tabId, text, options); }

  stopFindInPage(tabId, action) { return this._pageTools.stopFindInPage(tabId, action); }

  print(tabId) { return this._pageTools.print(tabId); }

  toggleDevTools(tabId) { return this._pageTools.toggleDevTools(tabId); }

  clearCache() { return TabSessionCache.clearAll(this._registry.entries()); }


  getEntry(tabId) { return this._registry.get(tabId); }

  getWebContents(tabId) {
    const entry = this._registry.get(tabId);
    return entry ? entry.webContents : null;
  }

  getAllTabs(options = {}) { return this._registry.list(options).map((entry) => this._channel.serialize(entry)); }

  getActiveTabId() { return this._registry.activeTabId; }

  findTabIdByWebContents(webContents) { return this._registry.findIdByWebContents(webContents); }

  tabForWebContents(webContents) {
    const id = this._registry.findIdByWebContents(webContents);
    if (id === null) return null;
    const entry = this._registry.get(id);
    return { id, hidden: !!entry.hidden, url: entry.url };
  }

  addConsoleLog(tabId, level, message, source, line) {
    TabConsoleLog.add(this._registry.get(tabId), level, message, source, line);
  }

  getConsoleLogs(tabId, options = {}) { return TabConsoleLog.list(this._registry.get(tabId), options); }


  performAccelerator(entry, action) { this._accelerators.perform(entry, action); }

  sendToRenderer(channel, payload) { this._channel.send(channel, payload); }


  _setupSharedVariablesFromParameters(mainWindow, deps) {
    this.mainWindow = mainWindow;
    this.preloadPath = deps.preloadPath;
    this.networkInterceptor = deps.networkInterceptor || null;
    this.chromeExtensionService = deps.chromeExtensionService || null;
    this.adblockerService = deps.adblockerService || null;
    this.db = deps.db || null;
    this.faviconCache = deps.faviconCache || null;
    this.downloads = new DownloadManager();
  }

  _buildTabState() {
    this._registry = new TabRegistry();
    this._channel = new TabStateChannel(this.mainWindow, this._registry, this.faviconCache);
    this._layout = new TabLayout(this._registry, this);
    this._activation = new TabActivation({
      mainWindow: this.mainWindow, registry: this._registry, channel: this._channel, layout: this._layout, emitter: this,
    });
    this._persisted = new PersistedTabs({
      db: this.db, registry: this._registry, channel: this._channel,
      createTab: (url, options) => this.createTab(url, options),
      destroyTab: (tabId) => this._lifecycle.destroy(tabId),
    });
  }

  _buildTabBehaviour() {
    const factory = new TabViewFactory({
      mainWindow: this.mainWindow, preloadPath: this.preloadPath, adblockerService: this.adblockerService,
      chromeExtensionService: this.chromeExtensionService, networkInterceptor: this.networkInterceptor,
    });
    this._lifecycle = new TabLifecycle({
      mainWindow: this.mainWindow, db: this.db, registry: this._registry, channel: this._channel, factory,
      activation: this._activation, persisted: this._persisted, wireEvents: (entry) => this._wireEvents(entry), emitter: this,
    });
    this._keepAlive = new KeepAliveSweep({ registry: this._registry, revive: (entry) => this._persisted.revive(entry) });
    this._zoom = new TabZoom({ db: this.db, registry: this._registry, channel: this._channel });
    this._loader = new TabLoader({ registry: this._registry, channel: this._channel });
    this._history = new TabHistory(this._registry);
    this._pageTools = new TabPageTools(this._registry);
    this._accelerators = new TabAcceleratorActions(this);
    this._notifications = new TabNotificationRelay({ registry: this._registry, channel: this._channel, emitter: this });
  }

  _buildPageEvents() {
    this._loadEvents = new TabLoadEvents({ channel: this._channel, zoom: this._zoom, persisted: this._persisted, emitter: this });
    this._pageEvents = new TabPageEvents({
      registry: this._registry, channel: this._channel, faviconCache: this.faviconCache,
      performAccelerator: (entry, action) => this.performAccelerator(entry, action),
    });
    this._popups = new TabPopupHandler({ registry: this._registry, createTab: (url, options) => this.createTab(url, options) });
    this._dataFiles = new DataFileDownloadHook({ registry: this._registry, downloads: this.downloads, closeTab: (tabId) => this.closeTab(tabId) });
  }

  _relayDownloads() {
    this.downloads.on('download', (info) => this._channel.send('tab-view:download', info));
  }

  _wireEvents(entry) {
    this._loadEvents.wire(entry);
    this._pageEvents.wire(entry);
    TabPermissionHook.install(entry);
    this._popups.wire(entry);
    this._dataFiles.install(entry.webContents.session);
  }
}

module.exports = TabViewManager;
