const { WebContentsView, session } = require('electron');
const ChromeIdentity = require('../ChromeIdentity');
const IdentityOverride = require('../identity/IdentityOverride');
const CrashTracer = require('../../diagnostics/CrashTracer');

class TabViewFactory {
  static MAX_LISTENERS = 20;
  static BACKGROUND = '#ffffff';
  static ZERO_BOUNDS = { x: 0, y: 0, width: 0, height: 0 };

  constructor({ hosts, preloadPath, adblockerService = null, chromeExtensionService = null, networkInterceptor = null }) {
    this._hosts = hosts;
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
    this._park(entry);
    CrashTracer.mark('tab:attached', { id: entry.id });
  }

  reparent(entry, toHostId) {
    CrashTracer.mark('tab:reparent', { id: entry.id, from: entry.hostId, to: toHostId });
    try { entry.view.setVisible(false); } catch (_) {}
    this.detach(entry);
    entry.hostId = toHostId;
    this._park(entry);
  }

  detach(entry) {
    const win = this._hosts.liveWindowOf(entry.hostId);
    if (!win) return;
    try { win.contentView.removeChildView(entry.view); } catch (_) {}
  }

  attachServices(entry) {
    this._applyAdblocker(entry);
    this._loadChromeExtensions(entry);
    this._attachNetworkLog(entry);
  }

  extensionsSettling(entry) {
    if (!this._chromeExtensions || typeof this._chromeExtensions.loadsInFlight !== 'function') return null;
    try { return this._chromeExtensions.loadsInFlight(entry.webContents.session); } catch (_) { return null; }
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

  _park(entry) {
    this._hosts.windowOf(entry.hostId).contentView.addChildView(entry.view);
    entry.view.setVisible(false);
    entry.view.setBounds(TabViewFactory.ZERO_BOUNDS);
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
