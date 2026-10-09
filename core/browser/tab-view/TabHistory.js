class TabHistory {
  constructor(registry) {
    this._registry = registry;
  }

  goBack(tabId) {
    const entry = this._registry.get(tabId);
    if (!entry) return { success: false };
    const nav = entry.webContents.navigationHistory;
    if (nav && nav.canGoBack()) nav.goBack();
    else if (entry.webContents.canGoBack && entry.webContents.canGoBack()) entry.webContents.goBack();
    return { success: true };
  }

  goForward(tabId) {
    const entry = this._registry.get(tabId);
    if (!entry) return { success: false };
    const nav = entry.webContents.navigationHistory;
    if (nav && nav.canGoForward()) nav.goForward();
    else if (entry.webContents.canGoForward && entry.webContents.canGoForward()) entry.webContents.goForward();
    return { success: true };
  }

  list(tabId) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabHistory._noHistory();
    try {
      const nav = entry.webContents.navigationHistory;
      const entries = nav.getAllEntries().map((e, index) => ({ index, url: e.url, title: e.title || e.url }));
      return { success: true, entries, activeIndex: nav.getActiveIndex() };
    } catch (_) {
      return TabHistory._noHistory();
    }
  }

  goToIndex(tabId, index) {
    const entry = this._registry.get(tabId);
    if (!entry) return { success: false };
    try {
      entry.webContents.navigationHistory.goToIndex(index);
    } catch (_) {
      return { success: false };
    }
    return { success: true };
  }

  static refreshButtons(entry) {
    try {
      const nav = entry.webContents.navigationHistory;
      entry.canGoBack = nav ? nav.canGoBack() : TabHistory._legacyCan(entry.webContents, 'canGoBack');
      entry.canGoForward = nav ? nav.canGoForward() : TabHistory._legacyCan(entry.webContents, 'canGoForward');
    } catch (_) {
      entry.canGoBack = false;
      entry.canGoForward = false;
    }
  }

  static _legacyCan(wc, method) {
    return wc[method] ? wc[method]() : false;
  }

  static _noHistory() {
    return { success: false, entries: [], activeIndex: -1 };
  }
}

module.exports = TabHistory;
