class BrowserService {
  static EVENTS = ['tabNavigated', 'tabCreated', 'tabClosed', 'webviewAttached'];

  constructor(tabManager, mainWindow, networkInterceptor) {
    this._tabManager = tabManager;
    this._mainWindow = mainWindow;
    this._networkInterceptor = networkInterceptor || null;
    this._visualGrounding = null;
    this._cdpListeners = new Map();
    this._webviewPreloads = new Map();
    this._eventListeners = BrowserService._emptyListenerTable();
  }

  async getTabs(options = {}) { return this._tabManager.getAllTabs(options); }
  async createTab(url, options) { return this._tabManager.createTab(url, options); }
  async closeTab(tabId) { return this._tabManager.closeTab(tabId); }
  async navigate(tabId, url) { return this._tabManager.updateTab(tabId, { type: 'navigate', payload: url }); }
  async waitForLoad(tabId, timeoutMs) { return this._tabManager.waitForLoad(tabId, timeoutMs); }
  async refresh(tabId) { return this._tabManager.updateTab(tabId, { type: 'refresh' }); }
  async getSource(tabId, options = {}) { return this._tabManager.getTabSource(tabId, options); }
  async screenshot(tabId, options = {}) { return this._tabManager.screenshotTab(tabId, options); }
  async click(tabId, options = {}) { return this._tabManager.clickElement(tabId, options); }
  async clickAt(tabId, options = {}) { return this._tabManager.clickAt(tabId, options); }
  async fill(tabId, options = {}) { return this._tabManager.fillForm(tabId, options); }
  async observePage(tabId) { return this._tabManager.observePage(tabId); }
  async typeInto(tabId, options = {}) { return this._tabManager.typeInto(tabId, options); }
  async waitFor(tabId, options = {}) { return this._tabManager.waitForElement(tabId, options); }
  async scroll(tabId, options = {}) { return this._tabManager.scrollPage(tabId, options); }
  async pressKey(tabId, options = {}) { return this._tabManager.pressKey(tabId, options); }
  async getElement(tabId, options = {}) { return this._tabManager.getElement(tabId, options); }
  async getTable(tabId, options = {}) { return this._tabManager.getTable(tabId, options); }
  async executeJs(tabId, code) { return this._tabManager.updateTab(tabId, { type: 'executeJs', payload: code }); }
  async getConsoleLogs(tabId, options = {}) { return this._tabManager.getConsoleLogs(tabId, options); }
  async handleDialog(tabId, options = {}) { return this._tabManager.handleDialog(tabId, options); }
  async extractData(tabId, options = {}) { return this._tabManager.extractData(tabId, options); }
  async selectOption(tabId, options = {}) { return this._tabManager.selectOption(tabId, options); }
  async setDate(tabId, options = {}) { return this._tabManager.setDate(tabId, options); }
  async setSlider(tabId, options = {}) { return this._tabManager.setSlider(tabId, options); }
  async collectList(tabId, options = {}) { return this._tabManager.collectList(tabId, options); }
  async checkSelectors(tabId, selectors) { return this._tabManager.checkSelectors(tabId, selectors); }

  setVisualGrounding(visualGrounding) {
    this._visualGrounding = visualGrounding || null;
  }

  hasVisualGrounding() {
    return !!(this._visualGrounding && this._visualGrounding.isAvailable());
  }

  async locate(tabId, options = {}) {
    if (!this._visualGrounding) return { success: false, error: 'Visual grounding is not available' };
    if (options.click) return this._visualGrounding.clickDescribed(tabId, options);
    return this._visualGrounding.locate(tabId, options);
  }

  attachCDP(extensionId, listener) {
    if (!this._cdpListeners.has(extensionId)) this._cdpListeners.set(extensionId, []);
    const listeners = this._cdpListeners.get(extensionId);
    listeners.push(listener);
    return () => BrowserService._removeFrom(listeners, listener);
  }

  getAllCDPListeners() {
    return [...this._cdpListeners.values()].flat();
  }

  registerWebviewPreload(extensionId, scriptPath) {
    this._webviewPreloads.set(extensionId, scriptPath);
    console.log(`BrowserService: registered webview preload from "${extensionId}"`);
  }

  getWebviewPreloads() {
    return this._webviewPreloads;
  }

  onTabNavigated(callback) { return this._subscribe('tabNavigated', callback); }
  onTabCreated(callback) { return this._subscribe('tabCreated', callback); }
  onTabClosed(callback) { return this._subscribe('tabClosed', callback); }
  onWebviewAttached(callback) { return this._subscribe('webviewAttached', callback); }

  emit(event, ...args) {
    for (const listener of this._eventListeners[event] || []) {
      try { listener(...args); } catch (e) { console.error(`BrowserService event error [${event}]:`, e); }
    }
  }

  getTabManager() { return this._tabManager; }
  getNetworkInterceptor() { return this._networkInterceptor; }
  getMainWindow() { return this._mainWindow; }

  _subscribe(event, callback) {
    const listeners = this._eventListeners[event];
    listeners.push(callback);
    return () => BrowserService._removeFrom(listeners, callback);
  }

  static _emptyListenerTable() {
    return Object.fromEntries(BrowserService.EVENTS.map((event) => [event, []]));
  }

  static _removeFrom(list, item) {
    const idx = list.indexOf(item);
    if (idx >= 0) list.splice(idx, 1);
  }
}

module.exports = BrowserService;
