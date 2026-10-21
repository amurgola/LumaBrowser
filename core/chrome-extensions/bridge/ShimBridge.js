const path = require('path');
const ChromeContextMenus = require('./ChromeContextMenus');
const ChromeWebNavigation = require('./ChromeWebNavigation');

class ShimBridge {
  static PRELOAD = path.join(__dirname, '..', 'shim', 'shim-worker-preload.js');
  static CALL = 'luma-shim:call';
  static EVENT = 'luma-shim:event';
  static EXTENSION_SCHEME = 'chrome-extension:';
  static EMPTY = new Set();

  constructor({ log = console } = {}) {
    this._log = log;
    this._sessions = new Set();
    this._handled = new WeakSet();
    this._workers = new WeakMap();
    this.contextMenus = new ChromeContextMenus({ onClick: (sess, extId, info, tab) => this.sendAwake(sess, extId, 'contextMenus', 'onClicked', [info, tab]) });
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

  forgetExtension(extId) {
    for (const sess of this._sessions) this.contextMenus.removeAll(sess, extId);
  }

  broadcast(sess, extId, ns, name, args) {
    for (const worker of this._workersOf(sess, extId)) {
      if (!worker.isDestroyed()) ShimBridge._send(worker, ns, name, args);
    }
  }

  broadcastAll(sess, ns, name, args) {
    const byExt = this._workers.get(sess);
    if (!byExt) return;
    for (const extId of byExt.keys()) this.broadcast(sess, extId, ns, name, args);
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
      case 'contextMenus.create': return this.contextMenus.create(sess, extId, args[0]);
      case 'contextMenus.update': return this.contextMenus.update(sess, extId, args[0], args[1]);
      case 'contextMenus.remove': return this.contextMenus.remove(sess, extId, args[0]);
      case 'contextMenus.removeAll': return this.contextMenus.removeAll(sess, extId);
      case 'webNavigation.getFrame': return this.webNavigation.getFrame(args[0]);
      case 'webNavigation.getAllFrames': return this.webNavigation.getAllFrames(args[0]);
      default: throw new Error(`Unknown shim call ${ns}.${op}`);
    }
  }

  static _send(worker, ns, name, args) {
    try { worker.send(ShimBridge.EVENT, { ns, name, args }); } catch (_) {}
  }

  _onConsole(message) {
    if (!message || !ShimBridge.extensionIdOf(message.sourceUrl || message.source || '')) return;
    if (message.level === 'error' || message.level === 'warning') {
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
