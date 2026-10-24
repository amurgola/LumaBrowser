class AppWindows {
  constructor({ browser = null, electron = null } = {}) {
    this._browser = browser;
    this._electron = electron;
  }

  getMainWindow() {
    const fromBrowser = this._browser && typeof this._browser.getMainWindow === 'function' ? this._browser.getMainWindow() : null;
    if (AppWindows._alive(fromBrowser)) return fromBrowser;
    const all = this._allWindows();
    return all.find((w) => AppWindows._alive(w) && /LumaBrowser/i.test(AppWindows._title(w))) || all.find(AppWindows._alive) || null;
  }

  focusMainWindow() {
    const win = this.getMainWindow();
    if (!win) return false;
    try {
      if (win.isMinimized()) win.restore();
      win.show();
      if (process.platform === 'win32' && typeof win.setAlwaysOnTop === 'function') {
        win.setAlwaysOnTop(true);
        win.focus();
        win.setAlwaysOnTop(false);
      } else {
        win.focus();
      }
      if (win.webContents && typeof win.webContents.focus === 'function') win.webContents.focus();
      return true;
    } catch (_) {
      return false;
    }
  }

  _allWindows() {
    try {
      const electron = this._electron || require('electron');
      return electron.BrowserWindow ? electron.BrowserWindow.getAllWindows() : [];
    } catch (_) {
      return [];
    }
  }

  static _alive(win) {
    return !!win && !(typeof win.isDestroyed === 'function' && win.isDestroyed());
  }

  static _title(win) {
    try { return String(win.getTitle()); } catch (_) { return ''; }
  }
}

module.exports = AppWindows;
