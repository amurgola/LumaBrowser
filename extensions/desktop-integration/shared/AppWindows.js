const WindowRaiser = require('../../../core/browser/WindowRaiser');

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
    if (!WindowRaiser.raise(win)) return false;
    try {
      if (win.webContents && typeof win.webContents.focus === 'function') win.webContents.focus();
    } catch (_) {}
    return true;
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
