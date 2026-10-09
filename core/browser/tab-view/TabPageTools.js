const TabRegistry = require('./TabRegistry');

class TabPageTools {
  constructor(registry) {
    this._registry = registry;
  }

  findInPage(tabId, text, { forward = true, findNext = false, matchCase = false } = {}) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    const query = String(text || '');
    if (!query) return this.stopFindInPage(tabId, 'clearSelection');
    try {
      return { success: true, requestId: entry.webContents.findInPage(query, { forward, findNext, matchCase }) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  stopFindInPage(tabId, action = 'clearSelection') {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    try { entry.webContents.stopFindInPage(action); } catch (_) {}
    return { success: true };
  }

  print(tabId) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    try {
      entry.webContents.print({}, (ok, reason) => TabPageTools._reportPrint(tabId, ok, reason));
    } catch (err) {
      return { success: false, error: err.message };
    }
    return { success: true };
  }

  toggleDevTools(tabId) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    const wc = entry.webContents;
    try {
      if (wc.isDevToolsOpened()) wc.closeDevTools();
      else wc.openDevTools({ mode: 'detach' });
    } catch (err) {
      return { success: false, error: err.message };
    }
    return { success: true };
  }

  static _reportPrint(tabId, ok, reason) {
    if (!ok && reason && reason !== 'cancelled') console.warn(`[TabViewManager] print failed for tab ${tabId}:`, reason);
  }
}

module.exports = TabPageTools;
