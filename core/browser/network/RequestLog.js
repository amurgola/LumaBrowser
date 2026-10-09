class RequestLog {
  static DEFAULT_LIMIT = 100;

  constructor(limit = RequestLog.DEFAULT_LIMIT) {
    this.limit = limit;
    this._entriesByWebContents = new Map();
    this._webContentsByTab = new Map();
  }

  mapTab(tabId, webContentsId) {
    if (tabId === undefined || tabId === null) return;
    this._webContentsByTab.set(String(tabId), webContentsId);
  }

  add(webContentsId, requestId, { url, method }) {
    const entries = this._entriesFor(webContentsId);
    entries.push({ requestId, url, method, timestamp: new Date().toISOString(), response: null });
    if (entries.length > this.limit) entries.shift();
  }

  recordResponse(webContentsId, requestId, { status, statusText, mimeType }) {
    const entries = this._entriesByWebContents.get(webContentsId);
    if (!entries) return;
    const entry = RequestLog._latest(entries, requestId);
    if (entry) entry.response = { status, statusText, mimeType };
  }

  forTab(tabId) {
    const webContentsId = this._webContentsByTab.get(String(tabId));
    if (webContentsId === undefined) return [];
    return RequestLog._clean(this._entriesByWebContents.get(webContentsId) || []);
  }

  all() {
    const merged = [];
    for (const entries of this._entriesByWebContents.values()) merged.push(...entries);
    return RequestLog._clean(merged);
  }

  forget(webContentsId) {
    this._entriesByWebContents.delete(webContentsId);
    for (const [tab, mapped] of this._webContentsByTab) {
      if (mapped === webContentsId) this._webContentsByTab.delete(tab);
    }
  }

  clearTabMappings() {
    this._webContentsByTab.clear();
  }

  _entriesFor(webContentsId) {
    if (!this._entriesByWebContents.has(webContentsId)) this._entriesByWebContents.set(webContentsId, []);
    return this._entriesByWebContents.get(webContentsId);
  }

  static _latest(entries, requestId) {
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].requestId === requestId) return entries[i];
    }
    return null;
  }

  static _clean(entries) {
    return entries
      .slice()
      .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))
      .map(({ url, method, timestamp, response }) => ({ url, method, timestamp, response }));
  }
}

module.exports = RequestLog;
