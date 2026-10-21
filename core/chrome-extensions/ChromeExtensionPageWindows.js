const { app, BrowserWindow, screen, session } = require('electron');
const TabKinds = require('../browser/tab-view/TabKinds');

class ChromeExtensionPageWindows {
  static KINDS = Object.freeze({
    popup: { width: 420, height: 640 },
    options: { width: 1040, height: 760 },
  });
  static WEB_URL = /^https?:\/\//i;
  static POPUP_MIN = { width: 25, height: 25 };
  static POPUP_MAX = { width: 800, height: 600 };
  static TOGGLE_GRACE_MS = 300;

  constructor({ service, openUrlInTab = null, sessionProvider = null }) {
    this._service = service;
    this._openUrlInTab = openUrlInTab;
    this._sessionProvider = sessionProvider || (() => session.fromPartition(TabKinds.SHARED_PARTITION));
    this._windows = new Map();
    this._blurClosedAt = new Map();
  }

  static pageUrl(id, page) {
    return `chrome-extension://${id}/${page}`;
  }

  async open(id, kind, anchor = null) {
    const size = ChromeExtensionPageWindows.KINDS[kind];
    if (!size) throw new Error(`Unknown extension page "${kind}"`);
    const ext = this._service.get(id);
    if (!ext) throw new Error(`Extension ${id} is not installed`);
    if (!ext.enabled) throw new Error(`Enable ${ext.name} before opening it`);
    const page = ext.pages && ext.pages[kind];
    if (!page) throw new Error(`${ext.name} has no ${kind} page`);

    const anchored = kind === 'popup' && ChromeExtensionPageWindows._validAnchor(anchor);
    const key = `${id}:${kind}${anchored ? ':anchored' : ''}`;
    const existing = this._windows.get(key);
    if (existing && !existing.isDestroyed()) {
      existing.focus();
      return { reused: true };
    }
    if (anchored && Date.now() - (this._blurClosedAt.get(id) || 0) < ChromeExtensionPageWindows.TOGGLE_GRACE_MS) {
      return { toggledClosed: true };
    }
    const sess = this._sessionProvider();
    await this._service.loadAllEnabled(sess);
    const win = anchored ? this._createAnchored(ext, page, sess, key, anchor) : this._create(ext, page, size, sess, key);
    this._windows.set(key, win);
    return { reused: false };
  }

  closeFor(id) {
    for (const [key, win] of [...this._windows]) {
      if (key.startsWith(`${id}:`) && !win.isDestroyed()) win.close();
    }
  }

  static _validAnchor(anchor) {
    return !!anchor && !!anchor.parent && !anchor.parent.isDestroyed() && Number.isFinite(anchor.x) && Number.isFinite(anchor.y);
  }

  _createAnchored(ext, page, sess, key, anchor) {
    const max = ChromeExtensionPageWindows.POPUP_MAX;
    const win = new BrowserWindow({
      width: ChromeExtensionPageWindows.KINDS.popup.width,
      height: ChromeExtensionPageWindows.KINDS.popup.height,
      show: false,
      frame: false,
      resizable: false,
      skipTaskbar: true,
      parent: anchor.parent,
      title: ext.name,
      backgroundColor: '#ffffff',
      webPreferences: {
        session: sess, contextIsolation: true, sandbox: true, nodeIntegration: false, enablePreferredSizeMode: true,
      },
    });
    const origin = anchor.parent.getContentBounds();
    const place = (width, height) => {
      const area = screen.getDisplayMatching(origin).workArea;
      const x = Math.min(Math.max(origin.x + anchor.x - width, area.x), area.x + area.width - width);
      const y = Math.min(origin.y + anchor.y, area.y + area.height - height);
      win.setBounds({ x: Math.round(x), y: Math.round(y), width, height });
    };
    place(win.getBounds().width, win.getBounds().height);
    win.webContents.on('preferred-size-changed', (_e, preferred) => {
      if (win.isDestroyed()) return;
      const min = ChromeExtensionPageWindows.POPUP_MIN;
      place(
        Math.min(Math.max(Math.ceil(preferred.width), min.width), max.width),
        Math.min(Math.max(Math.ceil(preferred.height), min.height), max.height),
      );
      if (!win.isVisible()) win.show();
    });
    win.once('ready-to-show', () => { if (!win.isDestroyed() && !win.isVisible()) win.show(); });
    win.on('blur', () => this._closeOnAppFocus(win, ext.id));
    this._wire(win, ext, key);
    win.loadURL(ChromeExtensionPageWindows.pageUrl(ext.id, page));
    return win;
  }

  _create(ext, page, size, sess, key) {
    const win = new BrowserWindow({
      ...size,
      title: ext.name,
      autoHideMenuBar: true,
      webPreferences: { session: sess, contextIsolation: true, sandbox: true, nodeIntegration: false },
    });
    this._wire(win, ext, key);
    win.loadURL(ChromeExtensionPageWindows.pageUrl(ext.id, page));
    return win;
  }

  _closeOnAppFocus(win, extId) {
    if (win.isDestroyed() || win.webContents.isDevToolsOpened()) return;
    const onFocus = (_event, focused) => {
      if (focused === win || win.isDestroyed()) return;
      app.removeListener('browser-window-focus', onFocus);
      this._blurClosedAt.set(extId, Date.now());
      win.close();
    };
    app.on('browser-window-focus', onFocus);
    win.once('focus', () => app.removeListener('browser-window-focus', onFocus));
    win.once('closed', () => app.removeListener('browser-window-focus', onFocus));
    const focusedNow = BrowserWindow.getFocusedWindow();
    if (focusedNow && focusedNow !== win) onFocus(null, focusedNow);
  }

  _wire(win, ext, key) {
    win.on('closed', () => this._windows.delete(key));
    win.webContents.setWindowOpenHandler(({ url }) => this._routeWindowOpen(ext.id, url));
  }

  _routeWindowOpen(id, url) {
    if (String(url).startsWith(`chrome-extension://${id}/`)) {
      return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true } };
    }
    if (ChromeExtensionPageWindows.WEB_URL.test(url) && this._openUrlInTab) {
      try { this._openUrlInTab(url); } catch (_) {}
    }
    return { action: 'deny' };
  }
}

module.exports = ChromeExtensionPageWindows;
