const path = require('path');
const ChromeContextMenus = require('./ChromeContextMenus');
const ChromeWebNavigation = require('./ChromeWebNavigation');
const ChromeTabs = require('./ChromeTabs');
const ChromeActionBadges = require('./ChromeActionBadges');

class ShimBridge {
  static PRELOAD = path.join(__dirname, '..', 'shim', 'shim-worker-preload.js');
  static CALL = 'luma-shim:call';
  static EVENT = 'luma-shim:event';
  static EXTENSION_SCHEME = 'chrome-extension:';
  static EMPTY = new Set();
  static CONSOLE_LEVELS = ['verbose', 'info', 'warning', 'error'];

  constructor({ log = console } = {}) {
    this._log = log;
    this._sessions = new Set();
    this._handled = new WeakSet();
    this._workers = new WeakMap();
    this._listening = new WeakMap();
    this._pages = new Set();
    this.tabs = new ChromeTabs({ broadcast: (sess, ns, name, argsFor) => this.broadcastAll(sess, ns, name, argsFor) });
    this.badges = new ChromeActionBadges({ activeTabs: () => this.tabs.activeTabs() });
    this.tabs.on('activated', () => this.badges.publish());
    this.tabs.on('navigated', (tabId) => this.badges.clearTab(tabId));
    this.tabs.on('removed', (tabId) => this.badges.clearTab(tabId));
    this.contextMenus = new ChromeContextMenus({
      onClick: (sess, extId, info, tab) => this.sendAwake(sess, extId, 'contextMenus', 'onClicked', [info, tab]),
      tabOf: (wc) => this.tabs.tabOf(wc),
    });
    this.webNavigation = new ChromeWebNavigation({ broadcast: (sess, name, details) => this.broadcastAll(sess, 'webNavigation', name, [details]) });
  }

  attach(sess) {
    if (!sess || this._sessions.has(sess) || !sess.serviceWorkers || typeof sess.registerPreloadScript !== 'function') return;
    this._sessions.add(sess);
    try {
      sess.registerPreloadScript({ type: 'service-worker', filePath: ShimBridge.PRELOAD });
    } catch (err) {
      this._log.warn('[chrome-ext] service worker preload not registered:', err && err.message);
      return;
    }
    sess.serviceWorkers.on('running-status-changed', (details) => this._onStatus(sess, details));
    sess.serviceWorkers.on('console-message', (_event, message) => this._onConsole(message));
  }

  installNavigation(app, getTabViewManager) {
    this.webNavigation.install(app, getTabViewManager);
  }

  attachTabs(tabViewManager) {
    this.tabs.watch(tabViewManager);
  }

  attachPage(wc) {
    if (!wc || this._pages.has(wc)) return;
    this._pages.add(wc);
    wc.once('destroyed', () => this._pages.delete(wc));
    try {
      wc.ipc.handle(ShimBridge.CALL, (event, request) => this._pageCall(event, request || {}));
    } catch (err) {
      this._log.warn('[chrome-ext] IPC for an extension page not wired:', err && err.message);
    }
  }

  forgetExtension(extId) {
    for (const sess of this._sessions) {
      this.contextMenus.removeAll(sess, extId);
      this._listenersIn(sess).delete(extId);
    }
    this.badges.forgetExtension(extId);
  }

  broadcastAll(sess, ns, name, args) {
    const argsFor = typeof args === 'function' ? args : () => args;
    for (const target of (sess ? [sess] : this._sessions)) {
      for (const [extId, events] of this._listenersIn(target)) {
        const forExt = events.has(`${ns}.${name}`) ? argsFor(extId) : null;
        if (forExt) this.sendAwake(target, extId, ns, name, forExt);
      }
    }
    this._broadcastToPages(sess, ns, name, argsFor);
  }

  _listenersIn(sess) {
    if (!this._listening.has(sess)) this._listening.set(sess, new Map());
    return this._listening.get(sess);
  }

  _listen(sess, extId, event) {
    const byExt = this._listenersIn(sess);
    if (!byExt.has(extId)) byExt.set(extId, new Set());
    byExt.get(extId).add(String(event));
  }

  _broadcastToPages(sess, ns, name, argsFor) {
    for (const wc of this._pages) {
      if (wc.isDestroyed() || (sess && wc.session !== sess)) continue;
      const extId = ShimBridge.extensionIdOf(wc.getURL());
      const forExt = extId ? argsFor(extId) : null;
      if (forExt) ShimBridge._send(wc, ns, name, forExt);
    }
  }

  _pageCall(event, request) {
    const extId = ShimBridge.extensionIdOf((event.senderFrame && event.senderFrame.url) || '');
    if (!extId) throw new Error('Not an extension page');
    return request.ns === 'bridge' ? undefined : this._call(event.sender.session, extId, request);
  }

  async sendAwake(sess, extId, ns, name, args) {
    const live = [...this._workersOf(sess, extId)].filter((w) => !w.isDestroyed());
    if (live.length) {
      for (const worker of live) ShimBridge._send(worker, ns, name, args);
      return;
    }
    try {
      const worker = await sess.serviceWorkers.startWorkerForScope(`${ShimBridge.EXTENSION_SCHEME}//${extId}/`);
      if (worker) ShimBridge._send(worker, ns, name, args);
    } catch (err) {
      this._log.warn(`[chrome-ext] could not wake ${extId} for ${ns}.${name}:`, err && err.message);
    }
  }

  _onStatus(sess, { versionId, runningStatus }) {
    let worker;
    try { worker = sess.serviceWorkers.getWorkerFromVersionID(versionId); } catch (_) { return; }
    if (!worker) return;
    const extId = ShimBridge.extensionIdOf(worker.scope);
    if (!extId) return;
    if (runningStatus === 'starting' || runningStatus === 'running') this._register(sess, extId, worker);
    else if (runningStatus === 'stopped') this._workersOf(sess, extId).delete(worker);
  }

  _register(sess, extId, worker) {
    const byExt = this._workers.get(sess) || new Map();
    this._workers.set(sess, byExt);
    if (!byExt.has(extId)) byExt.set(extId, new Set());
    byExt.get(extId).add(worker);
    if (this._handled.has(worker)) return;
    this._handled.add(worker);
    try {
      worker.ipc.handle(ShimBridge.CALL, (_event, request) => this._call(sess, extId, request || {}));
    } catch (err) {
      this._log.warn(`[chrome-ext] IPC for ${extId} not wired:`, err && err.message);
    }
  }

  _workersOf(sess, extId) {
    const byExt = this._workers.get(sess);
    return (byExt && byExt.get(extId)) || ShimBridge.EMPTY;
  }

  _call(sess, extId, { ns, op, args = [] }) {
    switch (`${ns}.${op}`) {
      case 'bridge.hello': return this.contextMenus.setName(sess, extId, args[0] && args[0].name);
      case 'bridge.listen': return this._listen(sess, extId, args[0]);
      case 'contextMenus.create': return this.contextMenus.create(sess, extId, args[0]);
      case 'contextMenus.update': return this.contextMenus.update(sess, extId, args[0], args[1]);
      case 'contextMenus.remove': return this.contextMenus.remove(sess, extId, args[0]);
      case 'contextMenus.removeAll': return this.contextMenus.removeAll(sess, extId);
      case 'webNavigation.getFrame': return this.webNavigation.getFrame(args[0]);
      case 'webNavigation.getAllFrames': return this.webNavigation.getAllFrames(args[0]);
      case 'tabs.query': return this.tabs.query(sess, extId, args[0]);
      case 'tabs.get': return this.tabs.get(sess, extId, args[0]);
      case 'action.setBadgeText': return this.badges.setText(extId, args[0]);
      case 'action.setBadgeBackgroundColor': return this.badges.setColor(extId, args[0]);
      default: throw new Error(`Unknown shim call ${ns}.${op}`);
    }
  }

  static _send(target, ns, name, args) {
    try { target.send(ShimBridge.EVENT, { ns, name, args }); } catch (_) {}
  }

  _onConsole(message) {
    if (!message || !ShimBridge.extensionIdOf(message.sourceUrl || message.source || '')) return;
    const level = ShimBridge.CONSOLE_LEVELS[message.level] || message.level;
    if (level === 'error' || level === 'warning') {
      this._log.warn(`[chrome-ext sw] ${message.message}`);
    }
  }

  static extensionIdOf(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === ShimBridge.EXTENSION_SCHEME ? parsed.hostname : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = ShimBridge;
