const EventEmitter = require('events');

class DebuggerProxy extends EventEmitter {
  static PROTOCOL_VERSION = '1.3';

  constructor(browserService) {
    super();
    this._browser = browserService;
    this._attached = new Map();
  }

  async attach(tabId) {
    if (this._attached.has(tabId)) return;
    const wc = this._requireWebContents(tabId);
    DebuggerProxy._ensureAttached(wc);
    this._listen(tabId, wc);
  }

  async sendCommand(tabId, method, params) {
    const wc = this._requireWebContents(tabId);
    DebuggerProxy._ensureAttached(wc);
    return wc.debugger.sendCommand(method, params || {});
  }

  async detach(tabId) {
    const entry = this._attached.get(tabId);
    if (!entry) return;
    DebuggerProxy._detachQuietly(entry.wc);
    this._cleanup(tabId);
  }

  isAttached(tabId) {
    return this._attached.has(tabId);
  }

  detachAll() {
    for (const tabId of [...this._attached.keys()]) this.detach(tabId);
  }

  _requireWebContents(tabId) {
    const wc = this._webContentsFor(tabId);
    if (!wc) throw new Error(`No webContents for tab ${tabId}`);
    return wc;
  }

  _webContentsFor(tabId) {
    const tabManager = this._browser.getTabManager();
    const entry = tabManager && tabManager.tabViewManager ? tabManager.tabViewManager.getEntry(tabId) : null;
    return entry ? entry.webContents : null;
  }

  _listen(tabId, wc) {
    const onMessage = (_event, method, params) => this.emit(`event:${tabId}`, { method, params });
    wc.debugger.on('message', onMessage);
    wc.on('destroyed', () => this._cleanup(tabId));
    this._attached.set(tabId, { wc, onMessage });
  }

  _cleanup(tabId) {
    const entry = this._attached.get(tabId);
    if (!entry) return;
    try { entry.wc.debugger.off('message', entry.onMessage); } catch (_) {}
    this._attached.delete(tabId);
    this.removeAllListeners(`event:${tabId}`);
    this.removeAllListeners(`detached:${tabId}`);
  }

  static _ensureAttached(wc) {
    if (!wc.debugger.isAttached()) wc.debugger.attach(DebuggerProxy.PROTOCOL_VERSION);
  }

  static _detachQuietly(wc) {
    try {
      if (wc && !wc.isDestroyed() && wc.debugger.isAttached()) wc.debugger.detach();
    } catch (_) {}
  }
}

module.exports = DebuggerProxy;
