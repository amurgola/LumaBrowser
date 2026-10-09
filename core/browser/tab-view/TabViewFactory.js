const { WebContentsView, session } = require('electron');
const ChromeIdentity = require('../ChromeIdentity');
const IdentityOverride = require('../identity/IdentityOverride');
const CrashTracer = require('../../diagnostics/CrashTracer');

class TabViewFactory {
  static MAX_LISTENERS = 20;
  static BACKGROUND = '#ffffff';
  static ZERO_BOUNDS = { x: 0, y: 0, width: 0, height: 0 };

  constructor({ mainWindow, preloadPath, adblockerService = null, chromeExtensionService = null, networkInterceptor = null }) {
    this._mainWindow = mainWindow;
    this._preloadPath = preloadPath;
    this._adblocker = adblockerService;
    this._chromeExtensions = chromeExtensionService;
    this._networkInterceptor = networkInterceptor;
  }

  createView({ partition, preloadPath, silent, keepAlive }) {
    const tabSession = TabViewFactory._sessionFor(partition);
    const view = new WebContentsView({ webPreferences: this._webPreferences(tabSession, preloadPath, silent, keepAlive) });
    TabViewFactory._prepareView(view);
    return view;
  }

  attach(entry) {
    CrashTracer.mark('tab:create', TabViewFactory._traceOf(entry));
    this._mainWindow.contentView.addChildView(entry.view);
    entry.view.setVisible(false);
    entry.view.setBounds(TabViewFactory.ZERO_BOUNDS);
    CrashTracer.mark('tab:attached', { id: entry.id });
  }

  attachServices(entry) {
    this._applyAdblocker(entry);
    this._loadChromeExtensions(entry);
    this._attachNetworkLog(entry);
  }

  static applyIdentity(entry) {
    IdentityOverride.apply(entry.webContents, { autoAttach: !entry.isAutomation() });
  }

  static _sessionFor(partition) {
    const tabSession = session.fromPartition(partition);
    tabSession.setUserAgent(ChromeIdentity.USER_AGENT, ChromeIdentity.acceptLanguage());
    return tabSession;
  }

  _webPreferences(tabSession, preloadPath, silent, keepAlive) {
    return {
      session: tabSession,
      preload: preloadPath || this._preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: !silent && !keepAlive,
    };
  }

  static _prepareView(view) {
    try { view.setBackgroundColor(TabViewFactory.BACKGROUND); } catch (_) {}
    view.webContents.setUserAgent(ChromeIdentity.USER_AGENT);
    view.webContents.setMaxListeners(TabViewFactory.MAX_LISTENERS);
  }

  static _traceOf(entry) {
    return {
      id: entry.id, wc: entry.webContents.id, kind: entry.kind, hidden: entry.hidden, keepAlive: entry.keepAlive,
      silent: entry.silent, partition: entry.partition, url: String(entry.url).slice(0, 120),
    };
  }

  _applyAdblocker(entry) {
    if (!this._adblocker) return;
    try { this._adblocker.applyToSession(entry.webContents.session); } catch (_) {}
  }

  _loadChromeExtensions(entry) {
    if (!this._chromeExtensions) return;
    this._chromeExtensions.ensureLoadedForWebContents(entry.webContents).catch((err) =>
      console.error('[chrome-ext] ensureLoadedForWebContents failed', err));
  }

  _attachNetworkLog(entry) {
    if (!this._networkInterceptor || entry.isAutomation()) return;
    this._networkInterceptor.attachToWebContents(entry.webContents, entry.id);
  }
}

module.exports = TabViewFactory;
