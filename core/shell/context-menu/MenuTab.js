class MenuTab {
  constructor(tabViewManager, entry) {
    this._tvm = tabViewManager || null;
    this._entry = entry || null;
  }

  static resolve(getTabViewManager, webContents) {
    try {
      const tvm = getTabViewManager ? getTabViewManager() : null;
      const tabId = MenuTab._tabIdOf(tvm, webContents);
      if (tabId === null || tabId === undefined) return new MenuTab(tvm, null);
      const entry = tvm.getEntry(tabId);
      return new MenuTab(tvm, entry && !entry.silent ? entry : null);
    } catch {
      return new MenuTab(null, null);
    }
  }

  get isTabPage() {
    return !!(this._tvm && this._entry);
  }

  get isInternal() {
    if (!this.isTabPage || !this._entry.kind) return false;
    const kinds = this._tvm.constructor.INTERNAL_KINDS;
    return !!(kinds && kinds.has(this._entry.kind));
  }

  get canGoBack() { return !!(this._entry && this._entry.canGoBack); }

  get canGoForward() { return !!(this._entry && this._entry.canGoForward); }

  goBack() { this._tvm.goBack(this._entry.id); }

  goForward() { this._tvm.goForward(this._entry.id); }

  reload() { this._tvm.reload(this._entry.id); }

  openInNewTab(url, activate = false) {
    if (!this._tvm || !url) return;
    this._tvm.createTab(url, {
      activate,
      partition: this._entry ? this._entry.partition : undefined,
      index: this._entry ? this._tvm.order.indexOf(this._entry.id) + 1 : undefined,
    });
  }

  static _tabIdOf(tvm, webContents) {
    if (!tvm) return null;
    if (typeof tvm.findTabIdByWebContents === 'function') return tvm.findTabIdByWebContents(webContents);
    return null;
  }
}

module.exports = MenuTab;
