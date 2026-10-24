const path = require('path');

class LumabyteWindows {
  static PREFIX = 'ext.desktop-integration.lumabyte.';
  static UI = path.join(__dirname, 'ui');

  constructor({ electron = null, focusWindow = null, events = null } = {}) {
    this._electron = electron;
    this._focusWindow = focusWindow;
    this._events = events;
  }

  placeAbove(win, hwnd) {
    const own = this.hwndOf(win);
    return own && this._events ? this._events.placeAbove(own, hwnd) : false;
  }

  dock(att) {
    const win = this._create({ focusable: false, width: 56, height: 56, page: 'dock.html', query: { label: att.label } });
    return win;
  }

  panel(att) {
    return this._create({ focusable: true, width: 384, height: 520, page: 'panel.html', query: { label: att.label } });
  }

  hwndOf(win) {
    try {
      const buf = win.getNativeWindowHandle();
      return buf.length >= 8 ? Number(buf.readBigUInt64LE(0)) : buf.readUInt32LE(0);
    } catch (_) {
      return 0;
    }
  }

  sendPanel(win, event) {
    try { win.webContents.send(`${LumabyteWindows.PREFIX}event`, event); } catch (_) {}
  }

  paintDock(win, state) {
    try { win.webContents.send(`${LumabyteWindows.PREFIX}dockState`, state); } catch (_) {}
  }

  focusApp(hwnd) {
    if (this._focusWindow) this._focusWindow(hwnd);
  }

  _create({ focusable, width, height, page, query }) {
    const { BrowserWindow } = this._electron || require('electron');
    const win = new BrowserWindow({
      show: false, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false,
      resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false,
      skipTaskbar: true, alwaysOnTop: false, focusable, width, height,
      webPreferences: {
        preload: path.join(LumabyteWindows.UI, 'preload.js'),
        sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false, spellcheck: true,
      },
    });
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:/i.test(url)) { try { require('electron').shell.openExternal(url); } catch (_) {} }
      return { action: 'deny' };
    });
    win.webContents.on('will-navigate', (e) => e.preventDefault());
    win.loadFile(path.join(LumabyteWindows.UI, page), { query }).catch(() => {});
    return win;
  }
}

module.exports = LumabyteWindows;
