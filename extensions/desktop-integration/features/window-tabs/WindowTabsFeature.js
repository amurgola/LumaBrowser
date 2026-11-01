const path = require('path');
const { pathToFileURL } = require('url');
const HotkeyBindings = require('../hotkeys/HotkeyBindings');
const WindowProbe = require('../lumabyte/WindowProbe');
const WindowTabInput = require('./WindowTabInput');

class WindowTabsFeature {
  static ACTION = 'open';
  static DEFAULT_BINDING = 'Ctrl+Alt+Shift+T';
  static UI = path.join(__dirname, 'ui');
  static PAGE = 'window-tab.html';
  static PRELOAD = path.join(WindowTabsFeature.UI, 'preload.js');
  static HINT_ID = 'window-tabs.open';
  static SHELL_CLASSES = new Set(['Progman', 'WorkerW', 'Shell_TrayWnd', 'Shell_SecondaryTrayWnd', 'Windows.UI.Core.CoreWindow']);
  static STATUS = { UNSUPPORTED: 501, NOT_FOUND: 404, REFUSED: 422, DISABLED: 503, NO_BROWSER: 503 };
  static MAX_WINDOWS = 60;

  static settingsSchema() {
    return [
      { key: 'binding', label: 'Open as tab shortcut', type: 'hotkey', default: WindowTabsFeature.DEFAULT_BINDING, help: 'Opens the window in front as a tab (or shows its tab). On the shortcut hint, the same key opens the picked window. Empty = no shortcut (REST still works).' },
      { key: 'control', label: 'Pass clicks, keys and scrolling on the tab through to the window', type: 'bool', default: true, help: 'With the tab\'s Control switch on, what you do on the live view goes to the real window as input, which comes to the front for each action. Uses desktop control, which must be allowed in the LLM tab (Visual grounding card). Also what a Tab Share guest with an interact link gets.' },
      { key: 'textRefreshSec', label: 'Window text refresh (seconds)', type: 'number', default: 10, min: 3, max: 120, help: 'How often the tab re-reads the window\'s accessible text (UI Automation) while it is the active tab; a background tab reads it less often.' },
      { key: 'frameRate', label: 'Capture frame rate', type: 'number', default: 30, min: 5, max: 60, help: 'The live view\'s frames per second.' },
    ];
  }

  static defaultParts(deps = {}) {
    const electron = require('electron');
    const TabKinds = require('../../../../core/browser/tab-view/TabKinds');
    const win = process.platform === 'win32';
    const probe = new WindowProbe({ screen: electron.screen });
    const parts = {
      platform: process.platform,
      globalShortcut: deps.shortcuts || electron.globalShortcut,
      probe,
      context: null,
      closeUia: () => {},
      getDesktop: () => global.__lumaDesktop || null,
      session: electron.session.fromPartition(TabKinds.SHARED_PARTITION),
      webContentsFromFrame: (frame) => electron.webContents.fromFrame(frame),
      sourceFor: (hwnd) => WindowTabsFeature._captureSource(electron.desktopCapturer, hwnd),
      icon: (image) => WindowTabsFeature._fileIcon(electron.app, image),
      focusWindow: win ? (h) => require('../../../../core/desktop/win32/Win32Windows').focusWindow(h) : () => false,
      listWindows: win ? () => require('../../../../core/desktop/Win32').listTopLevelWindows({ includeOwned: false }) : () => [],
      imagePath: win ? (pid) => require('../../../../core/desktop/Win32').processImagePath(pid) : () => '',
    };
    if (win) {
      const Win32 = require('../../../../core/desktop/Win32');
      const WindowObserver = require('../../../../core/desktop/service/WindowObserver');
      const WindowContext = require('../lumabyte/WindowContext');
      let uia = null;
      parts.context = new WindowContext({
        capture: Win32,
        nativeImage: electron.nativeImage,
        uia: () => { if (!uia) uia = new (require('../../../../core/desktop/uia/UiaHost'))(); return uia; },
        observer: new WindowObserver({ win: Win32, sleep: (ms) => new Promise((r) => setTimeout(r, ms)) }),
        probe,
      });
      parts.closeUia = () => { if (uia) { try { uia.close(); } catch (_) {} uia = null; } };
    }
    return parts;
  }

  static async _captureSource(desktopCapturer, hwnd) {
    if (!desktopCapturer || typeof desktopCapturer.getSources !== 'function') return null;
    const sources = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 0, height: 0 }, fetchWindowIcons: false });
    const prefix = `window:${hwnd}:`;
    return (sources || []).find((s) => String(s.id || '').startsWith(prefix)) || null;
  }

  static async _fileIcon(app, image) {
    if (!image || !app || typeof app.getFileIcon !== 'function') return null;
    const icon = await app.getFileIcon(image, { size: 'normal' });
    return icon && !icon.isEmpty() ? icon.toDataURL() : null;
  }

  constructor(deps, parts) {
    this._deps = deps;
    this._parts = parts;
    this._probe = parts.probe;
    this._platform = parts.platform || process.platform;
    this._tabs = new Map();
    this._bindings = new HotkeyBindings({ globalShortcut: parts.globalShortcut, onFire: () => this.fire(), log: deps.log });
    this._input = new WindowTabInput({ getDesktop: parts.getDesktop, probe: parts.probe, allowed: () => deps.settings.get('control', true) !== false });
    this._pageBase = pathToFileURL(path.join(WindowTabsFeature.UI, WindowTabsFeature.PAGE)).href;
    this._unhint = null;
    this._handler = false;
    this._disposed = false;
  }

  get supported() {
    return this._platform === 'win32' && !!this._probe.supported && !!this._deps.browser;
  }

  start() {
    this.applyBindings();
    this._registerIpc();
    this._installCapture();
    if (this._deps.hints) this._unhint = this._deps.hints.add('window-tabs', (context) => this.hintEntries(context));
  }

  fire() {
    const hints = this._deps.hints;
    const framed = hints ? hints.target() : 0;
    if (hints) hints.dismiss();
    return this.open(framed || this._probe.foreground(), { via: 'hotkey' });
  }

  hintEntries({ framed = 0, hwnd = 0 } = {}) {
    const st = this._bindings.status()[WindowTabsFeature.ACTION];
    if (!st || !st.registered) return [];
    const base = { id: WindowTabsFeature.HINT_ID, accelerator: st.accelerator, run: (source) => this.open((source && source.hwnd) || framed || hwnd, { via: 'hint' }) };
    if (!this.supported) return [{ ...base, label: 'Open as tab', disabled: true, note: 'Window tabs need Windows and the browser' }];
    const target = this._rootOf(framed || hwnd || this._probe.foreground());
    const problem = target ? this._refusal(target) : 'Click into an app window to open it as a tab';
    if (problem) return [{ ...base, label: 'Open as tab', disabled: true, note: problem }];
    const app = this._probe.app(target);
    if (this._tabs.has(target)) return [{ ...base, label: 'Show tab', note: `${app.name} is already open as a tab; this shows it` }];
    return [{ ...base, label: 'Open as tab', note: `Opens ${app.name} as a live tab in LumaBrowser: ask the chat about it, share it, or work in it from the tab` }];
  }

  async open(hwnd, { via = null } = {}) {
    if (this._disposed) return { success: false, error: 'Window tabs is off', code: 'DISABLED' };
    if (!this.supported) return { success: false, error: 'Window tabs need Windows and the browser', code: 'UNSUPPORTED' };
    const target = this._rootOf(hwnd);
    if (!target) return { success: false, error: 'No window to open', code: 'NOT_FOUND' };
    const problem = this._refusal(target);
    if (problem) return { success: false, error: problem, code: 'REFUSED' };
    await this._syncTabs();
    const existing = this._tabs.get(target);
    if (existing && existing.tabId != null) {
      this._switchTo(existing.tabId);
      this._focusApp();
      return { success: true, hwnd: target, tabId: existing.tabId, created: false };
    }
    const app = this._probe.app(target);
    const title = this._probe.title(target);
    let created;
    try {
      created = await this._deps.browser.createTab(this.pageUrl(target, app), { activate: true, title: title || app.name, preloadPath: WindowTabsFeature.PRELOAD });
    } catch (err) {
      return { success: false, error: `Could not open a tab: ${(err && err.message) || err}`, code: 'NO_BROWSER' };
    }
    const tab = created && created.tab ? created.tab : created;
    const tabId = tab && tab.id != null ? Number(tab.id) : null;
    if (created && created.success === false) return { success: false, error: created.error || 'Could not open a tab', code: 'NO_BROWSER' };
    this._tabs.set(target, { tabId, app, title, openedAt: Date.now() });
    this._focusApp();
    this._tell('opened', { hwnd: target, tabId, app: app.name, via });
    return { success: true, hwnd: target, tabId, created: true };
  }

  async close(hwnd) {
    await this._syncTabs();
    const entry = this._tabs.get(Number(hwnd));
    if (!entry) return { success: false, error: 'No tab for that window', code: 'NOT_FOUND' };
    this._tabs.delete(Number(hwnd));
    if (entry.tabId != null) {
      try { await this._deps.browser.closeTab(entry.tabId); } catch (_) {}
    }
    this._tell('closed', { hwnd: Number(hwnd), tabId: entry.tabId });
    return { success: true, hwnd: Number(hwnd), tabId: entry.tabId };
  }

  async list() {
    await this._syncTabs();
    return [...this._tabs].map(([hwnd, t]) => {
      const alive = this._probe.alive(hwnd);
      return { hwnd, tabId: t.tabId, app: t.app.name, exe: t.app.exe, title: alive ? (this._probe.title(hwnd) || t.title) : t.title, alive };
    });
  }

  pageUrl(hwnd, app = {}) {
    return `${this._pageBase}?hwnd=${Number(hwnd)}&app=${encodeURIComponent(String((app && app.exe) || ''))}`;
  }

  state(page) {
    const hwnd = page.hwnd;
    const alive = !!hwnd && this._probe.alive(hwnd);
    const app = alive ? this._probe.app(hwnd) : null;
    if (alive && !this._tabs.has(hwnd) && WindowTabsFeature._sameProgram(app, page.exe) && !this._refusal(hwnd)) {
      this._tabs.set(hwnd, { tabId: null, app, title: this._probe.title(hwnd), openedAt: Date.now() });
    }
    const ok = alive && this._tabs.has(hwnd);
    const s = this._deps.settings;
    return {
      success: true,
      hwnd,
      alive: ok,
      title: ok ? this._probe.title(hwnd) : '',
      app: app ? { name: app.name, exe: app.exe } : null,
      minimized: ok && this._probe.minimized(hwnd),
      visible: ok && this._probe.visible(hwnd),
      control: this._input.status(),
      textRefreshSec: WindowTabsFeature._num(s.get('textRefreshSec', 10), 10, 3, 120),
      frameRate: WindowTabsFeature._num(s.get('frameRate', 30), 30, 5, 60),
    };
  }

  async text(page) {
    if (!this._tabs.has(page.hwnd) || !this._probe.alive(page.hwnd)) return { success: false, error: 'The window is gone.' };
    if (!this._parts.context) return { success: false, error: 'Window text needs Windows.' };
    try {
      const r = await this._parts.context.read(page.hwnd, { screenshot: false, text: true });
      return { success: true, title: r.title, text: r.text || '', notes: r.notes || [] };
    } catch (err) {
      return { success: false, error: (err && err.message) || String(err) };
    }
  }

  async icon(page) {
    if (!this._tabs.has(page.hwnd) || !this._probe.alive(page.hwnd)) return { success: false, dataUrl: null };
    try {
      const app = this._probe.app(page.hwnd);
      const dataUrl = await this._parts.icon(this._parts.imagePath(app.pid));
      return { success: !!dataUrl, dataUrl: dataUrl || null };
    } catch (_) {
      return { success: false, dataUrl: null };
    }
  }

  windows() {
    let list = [];
    try { list = this._parts.listWindows() || []; } catch (_) { list = []; }
    const out = [];
    for (const w of list) {
      const hwnd = Number(w.hwnd) || 0;
      if (!hwnd || !String(w.title || '').trim() || this._refusal(hwnd)) continue;
      const app = this._probe.app(hwnd);
      out.push({ hwnd, title: String(w.title).trim(), app: app.name, exe: app.exe, open: this._tabs.has(hwnd) });
      if (out.length >= WindowTabsFeature.MAX_WINDOWS) break;
    }
    return { success: true, windows: out };
  }

  adopt(page, data, sender) {
    const target = this._rootOf(Number(data && data.hwnd));
    if (!target) return { success: false, error: 'No such window' };
    const problem = this._refusal(target);
    if (problem) return { success: false, error: problem };
    const previous = this._tabs.get(page.hwnd);
    if (previous && page.hwnd !== target) this._tabs.delete(page.hwnd);
    const app = this._probe.app(target);
    if (!this._tabs.has(target)) this._tabs.set(target, { tabId: previous ? previous.tabId : null, app, title: this._probe.title(target), openedAt: Date.now() });
    const url = this.pageUrl(target, app);
    if (sender && typeof sender.loadURL === 'function') { try { sender.loadURL(url); } catch (_) {} }
    return { success: true, hwnd: target, url };
  }

  describe() {
    const st = this._bindings.status()[WindowTabsFeature.ACTION] || { accelerator: '', registered: false, error: null };
    return { platform: this._platform, supported: this.supported, binding: st.accelerator, registered: st.registered, conflict: st.error, control: this._input.status() };
  }

  mount(router) {
    router.get('/', async (_req, res) => res.json({ success: true, ...this.describe(), tabs: await this.list() }));
    router.post('/open', async (req, res) => {
      const body = req.body || {};
      const hwnd = body.hwnd != null ? Number(body.hwnd) : this._probe.foreground();
      const r = await this.open(hwnd, { via: 'rest' });
      res.status(r.success ? 200 : WindowTabsFeature.statusFor(r.code)).json(r);
    });
    router.post('/close', async (req, res) => {
      const hwnd = req.body && req.body.hwnd != null ? Number(req.body.hwnd) : NaN;
      if (!Number.isFinite(hwnd)) return res.status(400).json({ success: false, error: 'hwnd is required' });
      const r = await this.close(hwnd);
      return res.status(r.success ? 200 : WindowTabsFeature.statusFor(r.code)).json(r);
    });
  }

  applyBindings() {
    const raw = this._deps.settings.get('binding', WindowTabsFeature.DEFAULT_BINDING);
    const status = this._bindings.apply({ [WindowTabsFeature.ACTION]: raw == null ? '' : String(raw) });
    const s = status[WindowTabsFeature.ACTION];
    if (s && s.error) this._deps.log.warn(`shortcut ${s.accelerator || '(none)'} not registered: ${s.error}`);
    return status;
  }

  onSettingsChanged(key) {
    if (key === 'binding') this.applyBindings();
  }

  dispose() {
    this._disposed = true;
    if (this._unhint) this._unhint();
    this._bindings.dispose();
    if (this._handler && this._parts.session) {
      try { this._parts.session.setDisplayMediaRequestHandler(null); } catch (_) {}
    }
    try { this._parts.closeUia(); } catch (_) {}
  }

  instance() {
    return {
      mount: (router) => this.mount(router),
      onSettingsChanged: (key, value) => this.onSettingsChanged(key, value),
      dispose: () => this.dispose(),
    };
  }

  static statusFor(code) {
    return WindowTabsFeature.STATUS[code] || 500;
  }


  _registerIpc() {
    const ipc = this._deps.ipc;
    if (!ipc) return;
    const page = (name, fn) => ipc.handle(`page.${name}`, (event, data) => {
      const p = this._pageOf(event && event.sender);
      if (!p) return { success: false, error: 'Not a window tab' };
      return fn(p, data || {}, event);
    });
    page('state', (p) => this.state(p));
    page('text', (p) => this.text(p));
    page('icon', (p) => this.icon(p));
    page('input', (p, data) => (this._tabs.has(p.hwnd) ? this._input.handle(p.hwnd, data) : { success: false, error: 'The window is gone.' }));
    page('restore', (p) => ({ success: this._tabs.has(p.hwnd) && !!this._parts.focusWindow(p.hwnd) }));
    page('windows', () => this.windows());
    page('open', (p, data, event) => this.adopt(p, data, event && event.sender));
  }

  _pageOf(sender) {
    let url = '';
    try { url = sender && typeof sender.getURL === 'function' ? String(sender.getURL() || '') : ''; } catch (_) { url = ''; }
    if (!url || !url.startsWith(this._pageBase)) return null;
    let params;
    try { params = new URL(url).searchParams; } catch (_) { return null; }
    return { hwnd: Number(params.get('hwnd')) || 0, exe: params.get('app') || '' };
  }


  _installCapture() {
    const session = this._parts.session;
    if (!session || typeof session.setDisplayMediaRequestHandler !== 'function') return;
    try {
      session.setDisplayMediaRequestHandler((request, callback) => this._grant(request, callback), { useSystemPicker: false });
      this._handler = true;
    } catch (err) {
      this._deps.log.warn(`display media handler not installed: ${(err && err.message) || err}`);
    }
  }

  _grant(request, callback) {
    const deny = () => { try { callback({}); } catch (_) {} };
    let wc = null;
    try { wc = request && request.frame ? this._parts.webContentsFromFrame(request.frame) : null; } catch (_) { wc = null; }
    const page = this._pageOf(wc);
    if (!page || !this._tabs.has(page.hwnd) || !this._probe.alive(page.hwnd)) return deny();
    Promise.resolve()
      .then(() => this._parts.sourceFor(page.hwnd))
      .then((source) => { if (source) callback({ video: source }); else deny(); }, (err) => { this._deps.log.warn(`window capture failed: ${(err && err.message) || err}`); deny(); });
    return undefined;
  }


  _rootOf(hwnd) {
    const h = Number(hwnd) || 0;
    if (!h || !this._probe.alive(h)) return 0;
    return this._probe.rootOwner(h) || h;
  }

  _refusal(hwnd) {
    if (!this._probe.alive(hwnd)) return 'That window is gone';
    const app = this._probe.app(hwnd);
    if (app.pid === process.pid) return 'That is a LumaBrowser window';
    if (WindowTabsFeature.SHELL_CLASSES.has(app.className)) return 'The desktop and the taskbar cannot be opened as tabs';
    return null;
  }

  async _syncTabs() {
    const browser = this._deps.browser;
    if (!browser || typeof browser.getTabs !== 'function') return;
    let tabs = [];
    try {
      const r = await browser.getTabs({});
      tabs = r && Array.isArray(r.tabs) ? r.tabs : (Array.isArray(r) ? r : []);
    } catch (_) {
      return;
    }
    const open = new Map();
    for (const t of tabs) {
      const page = this._pageOf({ getURL: () => t.url });
      if (page && page.hwnd) open.set(page.hwnd, t.id);
    }
    for (const [hwnd, entry] of this._tabs) {
      if (!open.has(hwnd)) this._tabs.delete(hwnd);
      else if (entry.tabId == null) entry.tabId = open.get(hwnd);
    }
  }

  _switchTo(tabId) {
    try {
      const tm = this._deps.browser && typeof this._deps.browser.getTabManager === 'function' ? this._deps.browser.getTabManager() : null;
      const tvm = tm && tm.tabViewManager;
      if (tvm && typeof tvm.switchToTab === 'function') tvm.switchToTab(tabId);
    } catch (_) {}
  }

  _focusApp() {
    const windows = this._deps.windows;
    if (windows && typeof windows.focusMainWindow === 'function') { try { windows.focusMainWindow(); } catch (_) {} }
  }

  _tell(event, data) {
    try { this._deps.broadcast(event, data); } catch (_) {}
  }

  static _sameProgram(app, exe) {
    if (!app) return false;
    if (!exe) return true;
    return String(app.exe || '').toLowerCase() === String(exe).toLowerCase();
  }

  static _num(value, fallback, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }
}

module.exports = WindowTabsFeature;
