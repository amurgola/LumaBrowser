const MainWindowOptions = require('./MainWindowOptions');
const WindowKeys = require('./WindowKeys');
const WindowStateRelay = require('./WindowStateRelay');
const ChromeOverlay = require('../../core/browser/ChromeOverlay');
const TabHosts = require('../../core/browser/tab-view/TabHosts');

class TabWindows {
  static SHELL_FILE = 'index.html';
  static DETACHED_QUERY = { window: 'detached' };
  static CHANNELS = ['tab-window:drag-out', 'tab-window:drop-in', 'tab-window:open'];
  static GRAB_OFFSET = { x: 120, y: 18 };
  static CASCADE = 32;
  static TEAR_OFF_DISTANCE = 40;

  constructor(ctx, { log = console } = {}) {
    this._ctx = ctx;
    this._log = log;
    this._windows = new Map();
    this._onEmptied = (windowId) => this._closeEmptied(windowId);
  }

  install(mainWindow, ipcMain = this._ctx.electron.ipcMain) {
    this._registerIpc(ipcMain);
    this._tvm().on('windowEmptied', this._onEmptied);
    mainWindow.on('closed', () => this.closeAll());
    return this;
  }

  get count() {
    return this._windows.size;
  }

  dragOut(sender, tabId) {
    const tvm = this._tvm();
    const fromId = tvm.windowIdForSender(sender);
    const fromWin = tvm.getWindow(fromId);
    const ownerId = tvm.windowIdOfTab(tabId);
    if (!fromWin || ownerId === null) return { moved: false };
    if (ownerId !== fromId) return { moved: true };
    const point = this._screen().getCursorScreenPoint();
    const fromBounds = fromWin.getBounds();
    const inside = TabWindows.contains(fromBounds, point);
    if (inside && TabWindows.nearStrip(fromBounds, point)) return { moved: false };
    const targetId = inside ? null : this._stripWindowIdAt(point, fromId);
    if (targetId !== null) return { moved: this._joinWindow(tabId, targetId) };
    if (tvm.getWindowTabs(fromId).length <= 1) {
      if (!inside && fromId !== TabHosts.MAIN_ID) fromWin.setPosition(...TabWindows._grabbedAt(point));
      return { moved: false };
    }
    return { moved: this.openWith(tabId, this._placeAtCursor(fromWin, point)) };
  }

  dropIn(sender, tabId, index) {
    const tvm = this._tvm();
    const toId = tvm.windowIdForSender(sender);
    const result = tvm.moveTabToWindow(tabId, toId, { index: Number.isInteger(index) ? index : undefined });
    if (result.success) TabWindows._focus(tvm.getWindow(toId));
    return result;
  }

  openFromMenu(sender, tabId) {
    const tvm = this._tvm();
    const fromWin = tvm.getWindow(tvm.windowIdForSender(sender));
    if (!fromWin) return { moved: false };
    const bounds = TabWindows._sizeOf(fromWin);
    const at = fromWin.getBounds();
    return { moved: this.openWith(tabId, { ...bounds, x: at.x + TabWindows.CASCADE, y: at.y + TabWindows.CASCADE }) };
  }

  openWith(tabId, bounds) {
    const entry = this._tvm().getEntry(tabId);
    if (!entry || !entry.isMovable()) return false;
    const { win, windowId } = this._create(bounds);
    this._moveInOnLoad(win, windowId, tabId);
    return true;
  }

  closeAll() {
    for (const { win } of [...this._windows.values()]) TabWindows._close(win);
  }

  static contains(bounds, point) {
    return point.x >= bounds.x && point.x < bounds.x + bounds.width && point.y >= bounds.y && point.y < bounds.y + bounds.height;
  }

  static nearStrip(bounds, point) {
    return point.y < bounds.y + MainWindowOptions.TITLE_BAR_HEIGHT + TabWindows.TEAR_OFF_DISTANCE;
  }

  _tvm() {
    return this._ctx.tabViewManager;
  }

  _screen() {
    return this._ctx.electron.screen;
  }

  _registerIpc(ipcMain) {
    const handle = (channel, fn) => {
      ipcMain.removeHandler(channel);
      ipcMain.handle(channel, fn);
    };
    handle('tab-window:drag-out', (e, tabId) => this.dragOut(e.sender, Number(tabId)));
    handle('tab-window:drop-in', (e, tabId, index) => this.dropIn(e.sender, Number(tabId), index));
    handle('tab-window:open', (e, tabId) => this.openFromMenu(e.sender, Number(tabId)));
  }

  _create(bounds) {
    const { BrowserWindow } = this._ctx.electron;
    const options = MainWindowOptions.build({
      platform: this._ctx.proc.platform, iconPath: this._ctx.iconPath(), preloadPath: this._ctx.path('preload.js'),
    });
    const win = new BrowserWindow({ ...options, ...bounds, show: false });
    const windowId = this._tvm().addWindow(win);
    const overlay = new ChromeOverlay(win);
    this._windows.set(windowId, { win, overlay });
    this._wire(win, windowId, overlay);
    win.loadFile(TabWindows.SHELL_FILE, { query: TabWindows.DETACHED_QUERY });
    return { win, windowId };
  }

  _wire(win, windowId, overlay) {
    const tvm = this._tvm();
    const raise = (id) => { if (id === windowId) overlay.raiseVisible(); };
    tvm.on('windowTabSwitched', raise);
    WindowKeys.attach(win);
    WindowStateRelay.attach(win);
    win.on('close', () => {
      tvm.off('windowTabSwitched', raise);
      this._windows.delete(windowId);
      tvm.removeWindow(windowId);
      overlay.destroy();
    });
  }

  _moveInOnLoad(win, windowId, tabId) {
    let loaded = false;
    win.webContents.on('did-finish-load', () => {
      if (loaded) { this._tvm().resyncWindow(windowId); return; }
      loaded = true;
      const result = this._tvm().moveTabToWindow(tabId, windowId);
      if (!result.success) {
        this._log.warn(`[tab-windows] could not move tab ${tabId} into window ${windowId}: ${result.error}`);
        TabWindows._close(win);
        return;
      }
      win.show();
      win.focus();
    });
  }

  _joinWindow(tabId, targetId) {
    const result = this._tvm().moveTabToWindow(tabId, targetId);
    if (result.success) TabWindows._focus(this._tvm().getWindow(targetId));
    return result.success;
  }

  _stripWindowIdAt(point, exceptId) {
    const tvm = this._tvm();
    const ids = [...this._windows.keys(), TabHosts.MAIN_ID];
    for (const id of ids) {
      const win = tvm.getWindow(id);
      if (id === exceptId || !win || !win.isVisible() || win.isMinimized()) continue;
      const bounds = win.getBounds();
      if (TabWindows.contains(bounds, point) && TabWindows.nearStrip(bounds, point)) return id;
    }
    return null;
  }

  _placeAtCursor(fromWin, point) {
    const size = TabWindows._sizeOf(fromWin);
    const [x, y] = TabWindows._grabbedAt(point);
    const area = this._screen().getDisplayNearestPoint(point).workArea;
    return {
      width: Math.min(size.width, area.width),
      height: Math.min(size.height, area.height),
      x: Math.max(area.x, Math.min(x, area.x + area.width - Math.min(size.width, area.width))),
      y: Math.max(area.y, Math.min(y, area.y + area.height - Math.min(size.height, area.height))),
    };
  }

  static _sizeOf(win) {
    const b = typeof win.getNormalBounds === 'function' ? win.getNormalBounds() : win.getBounds();
    return { width: b.width, height: b.height };
  }

  static _grabbedAt(point) {
    return [Math.round(point.x - TabWindows.GRAB_OFFSET.x), Math.round(point.y - TabWindows.GRAB_OFFSET.y)];
  }

  _closeEmptied(windowId) {
    const record = this._windows.get(windowId);
    if (record) TabWindows._close(record.win);
  }

  static _focus(win) {
    if (!win || win.isDestroyed()) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }

  static _close(win) {
    try { if (!win.isDestroyed()) win.close(); } catch (_) {}
  }
}

module.exports = TabWindows;
