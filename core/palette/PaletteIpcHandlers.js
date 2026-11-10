const { ipcMain, BrowserWindow } = require('electron');

class PaletteIpcHandlers {
  static DIG_EVENT = 'core.palette.digEvent';

  constructor({ palette, getTabViewManager, ipc = ipcMain, windowFor = null }) {
    this._palette = palette;
    this._tvm = getTabViewManager || (() => null);
    this._ipc = ipc;
    this._windowFor = windowFor || ((wc) => (BrowserWindow ? BrowserWindow.fromWebContents(wc) : null));
  }

  register() {
    const p = this._palette;
    this._fromPalette('core.palette.search', (win, _e, q) => ({ success: true, ...p.query(win, q) }));
    this._fromPalette('core.palette.open', (win, _e, item) => p.open(win, item));
    this._fromPalette('core.palette.close', (win) => { p.close(win); return { success: true }; });
    this._fromPalette('core.palette.dig', (_win, e, q) => this._dig(e.sender, q));
    this._fromPalette('core.palette.digAbort', (_win, e) => { p.digDeeper.abort(e.sender); return { success: true }; });
    this._fromPalette('core.palette.continueInChat', (win, _e, q) => { p.close(win, { restoreFocus: false }); return p.continueInChat(q); });
    this._fromAppPage('core.palette.toggle', (e) => p.toggle(this._windowFor(e.sender)));
    this._fromAppPage('core.palette.getDoubleShift', () => ({ success: true, enabled: p.isDoubleShiftEnabled() }));
    this._fromChrome('core.palette.setDoubleShift', (_e, enabled) => p.setDoubleShiftEnabled(enabled));
    this._ipc.handle('core.palette.record', (e, place) => (this._mayRecord(e && e.sender) ? { success: p.record(place) } : { success: false }));
  }

  _dig(sender, query) {
    const emit = (type, payload) => {
      try { if (!sender.isDestroyed()) sender.send(PaletteIpcHandlers.DIG_EVENT, { type, ...payload }); } catch (_) {}
    };
    this._palette.digDeeper.start(query, emit, sender).catch((err) => emit('error', { message: err.message }));
    return { success: true };
  }

  _mayRecord(sender) {
    const tvm = this._tvm();
    if (!sender || !tvm) return false;
    if (tvm.isChromeSender(sender)) return true;
    const entry = tvm.tabForWebContents ? tvm.tabForWebContents(sender) : null;
    return !!(entry && entry.internal);
  }

  _fromPalette(channel, fn) {
    this._ipc.handle(channel, (e, ...args) => {
      const win = this._palette.windowForSender(e && e.sender);
      if (!win) return { success: false, error: 'not a palette' };
      return fn(win, e, ...args);
    });
  }

  _fromAppPage(channel, fn) {
    this._ipc.handle(channel, (e, ...args) => {
      if (!this._mayRecord(e && e.sender)) return { success: false, error: 'not the browser chrome or an app tab' };
      return fn(e, ...args);
    });
  }

  _fromChrome(channel, fn) {
    this._ipc.handle(channel, (e, ...args) => {
      const tvm = this._tvm();
      if (!tvm || !tvm.isChromeSender(e && e.sender)) return { success: false, error: 'not the browser chrome' };
      return fn(e, ...args);
    });
  }
}

module.exports = PaletteIpcHandlers;
