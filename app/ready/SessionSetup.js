const ChromeIdentity = require('../../core/browser/ChromeIdentity');
const DnsResolver = require('../../core/shell/DnsResolver');
const PermissionManager = require('../../core/browser/PermissionManager');
const InternalBearerInjector = require('./InternalBearerInjector');

class SessionSetup {
  static MAIN_PARTITION = 'persist:main';

  constructor(ctx, { log = console } = {}) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._log = log;
    this._bearer = new InternalBearerInjector({ apiSecurity: ctx.services.apiSecurity, port: ctx.apiPort });
  }

  applyPolicies() {
    const { session } = this._ctx.electron;
    ChromeIdentity.applyToSession(session.defaultSession);
    this._applyDnsProvider();
    this._installPermissions(session);
  }

  hookSessions() {
    const { session } = this._ctx.electron;
    this._ctx.app.on('session-created', (sess) => this._onSessionCreated(sess));
    this._bearer.attach(session.defaultSession);
    this._bearer.attach(session.fromPartition(SessionSetup.MAIN_PARTITION));
    this._attachShimBridge(session.defaultSession);
    this._attachShimBridge(session.fromPartition(SessionSetup.MAIN_PARTITION));
  }

  _attachShimBridge(sess) {
    const bridge = this._s.chromeExtensionService && this._s.chromeExtensionService.bridge;
    if (bridge) bridge.attach(sess);
  }

  _applyDnsProvider() {
    const provider = this._s.db.get('core.network.dnsProvider', 'default');
    if (provider !== 'default') DnsResolver.applyProvider(provider);
  }

  _installPermissions(session) {
    const permissions = new PermissionManager({
      db: this._s.db,
      getMainWindow: () => this._ctx.mainWindow,
      windowForTab: (tabId) => (this._ctx.tabViewManager ? this._ctx.tabViewManager.windowOfTab(tabId) : null),
      resolveTab: (wc) => (this._ctx.tabViewManager ? this._ctx.tabViewManager.tabForWebContents(wc) : null),
    });
    PermissionManager.install(permissions);
    permissions.attachSession(session.defaultSession);
    permissions.attachSession(session.fromPartition(SessionSetup.MAIN_PARTITION));
  }

  _onSessionCreated(sess) {
    const chromeExtensions = this._s.chromeExtensionService;
    this._attachShimBridge(sess);
    if (chromeExtensions.ready) {
      chromeExtensions.loadAllEnabled(sess).catch((err) => this._log.error('[chrome-ext] loadAllEnabled failed', err));
    }
    if (this._s.adblockerService.ready) this._s.adblockerService.applyToSession(sess);
    this._bearer.attach(sess);
  }
}

module.exports = SessionSetup;
