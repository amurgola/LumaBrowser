const path = require('path');
const Attachment = require('./Attachment');
const LumabyteActions = require('./LumabyteActions');
const LumabyteChat = require('./LumabyteChat');
const LumabyteFiles = require('./LumabyteFiles');
const ThreadStore = require('./ThreadStore');
const WindowProbe = require('./WindowProbe');
const HotkeyBindings = require('../hotkeys/HotkeyBindings');

class LumabyteFeature {
  static ACTION = 'attach';
  static DEFAULT_BINDING = 'Ctrl+Alt+Shift+A';
  static POLL_MS = 120;
  static EVENT_POLL_MS = 500;
  static MAX_ATTACHMENTS = 8;
  static NOTICE_MS = 2600;
  static SHELL_CLASSES = new Set(['Progman', 'WorkerW', 'Shell_TrayWnd', 'Shell_SecondaryTrayWnd', 'Windows.UI.Core.CoreWindow']);
  static TRANSCRIPT_MAX_CHARS = 60000;

  static settingsSchema() {
    return [
      { key: 'binding', label: 'Attach shortcut', type: 'hotkey', default: LumabyteFeature.DEFAULT_BINDING, help: 'Attaches Lumabyte to the window in front and opens its panel; on an attached window it shows or hides the panel. Empty = no shortcut.' },
      { key: 'model', label: 'Model', type: 'text', default: '', help: 'A chat model reference (as in the chat model picker). Empty uses the chat\'s current model. One that can see images works best.' },
      { key: 'screenshot', label: 'Send a screenshot of the window with each message', type: 'bool', default: true, help: 'Only when the model can see images. Taken when you send, never in between, and never stored.' },
      { key: 'windowText', label: 'Send the window\'s accessible text with each message', type: 'bool', default: true, help: 'Control names and roles read through UI Automation; helps any model, including ones that cannot see images.' },
      { key: 'actions', label: 'Let Lumabyte act in the window when you ask', type: 'bool', default: true, help: 'Ask it to open, click, type or scroll and it does, step by step, on the attached window only. Uses desktop control, which must be allowed in the LLM tab (Visual grounding card).' },
      { key: 'files', label: 'Let Lumabyte read files when you ask', type: 'bool', default: true, help: 'Ask it about a file ("summarize Andy.md") and it reads the file\'s text, or lists a folder; names resolve against the folder open in File Explorer. Local files only, and only the start of a large file.' },
      { key: 'maxActions', label: 'Actions per reply', type: 'number', default: LumabyteActions.MAX_ACTIONS, min: 1, max: 30, help: 'How many clicks, keys and scrolls Lumabyte may run before it looks at the window again. Ctrl+Alt+Shift+Escape stops a run at any point.' },
      { key: 'thinking', label: 'Let the model think before answering', type: 'bool', default: false, help: 'Slower, sometimes better on hard questions.' },
    ];
  }

  static defaultParts(deps = {}) {
    const electron = require('electron');
    const ExtensionGlobals = require('../../../../core/shell/extensions/ExtensionGlobals');
    const win = process.platform === 'win32';
    const probe = new WindowProbe({ screen: electron.screen });
    const LumabyteWindows = require('./LumabyteWindows');
    const events = win ? new (require('./WinEvents'))() : null;
    const parts = {
      globalShortcut: deps.shortcuts || electron.globalShortcut,
      probe,
      getRouter: () => ExtensionGlobals.chatRouter(),
      getDesktop: () => global.__lumaDesktop || null,
      threads: new ThreadStore({ file: path.join(electron.app.getPath('userData'), 'lumabyte', 'threads.json') }),
      windows: new LumabyteWindows({ electron, events, focusWindow: win ? (h) => require('../../../../core/desktop/win32/Win32Windows').focusWindow(h) : null }),
      events,
      context: null,
      closeUia: () => {},
    };
    if (win) {
      const Win32 = require('../../../../core/desktop/Win32');
      const WindowObserver = require('../../../../core/desktop/service/WindowObserver');
      const WindowContext = require('./WindowContext');
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

  constructor(deps, parts) {
    this._deps = deps;
    this._parts = parts;
    this._probe = parts.probe;
    this._threads = parts.threads;
    this._si = parts.setInterval || setInterval;
    this._ci = parts.clearInterval || clearInterval;
    this._attachments = new Map();
    this._timer = null;
    this._disposed = false;
    this._chat = new LumabyteChat({
      getRouter: parts.getRouter,
      context: parts.context,
      threads: parts.threads,
      actions: new LumabyteActions({ getDesktop: parts.getDesktop || (() => null), files: parts.files === undefined ? new LumabyteFiles() : parts.files }),
      options: () => this._options(),
    });
    this._bindings = new HotkeyBindings({ globalShortcut: parts.globalShortcut, onFire: () => this.fire(), log: deps.log });
    this._unhint = null;
  }

  get supported() {
    return process.platform === 'win32' && !!this._probe.supported && !!this._parts.context;
  }

  start() {
    this.applyBindings();
    this._registerIpc();
    if (this._deps.hints) this._unhint = this._deps.hints.add('lumabyte', (context) => this.hintEntries(context));
  }

  fire() {
    const hints = this._deps.hints;
    const framed = hints ? hints.target() : 0;
    if (hints) hints.dismiss();
    return framed ? this.attachOrToggle(framed) : this.toggleForeground();
  }

  hintEntries({ framed = 0, hwnd = 0 } = {}) {
    const st = this._bindings.status()[LumabyteFeature.ACTION];
    if (!st || !st.registered) return [];
    const base = { id: 'lumabyte.attach', accelerator: st.accelerator, run: (source) => this.attachOrToggle((source && source.hwnd) || framed || hwnd) };
    if (!this.supported) return [{ ...base, label: 'Attach', disabled: true, note: 'Lumabyte needs Windows for now' }];
    const target = framed || hwnd || this._probe.foreground();
    const att = this._attachmentOwning(target) || (target ? this._attachments.get(this._probe.rootOwner(target)) : null);
    if (att) {
      return [{ ...base, label: att.open ? 'Hide Lumabyte' : 'Show Lumabyte', note: `Lumabyte is on ${att.app.name}; this ${att.open ? 'hides' : 'shows'} its panel` }];
    }
    const app = target ? this._probe.app(this._probe.rootOwner(target)) : null;
    if (!app || app.pid === process.pid || LumabyteFeature.SHELL_CLASSES.has(app.className)) {
      return [{ ...base, label: 'Attach', disabled: true, note: 'Click into an app window to attach Lumabyte to it' }];
    }
    return [{ ...base, label: 'Attach', note: `Docks Lumabyte on ${app.name} for a conversation about what is on it` }];
  }

  attachOrToggle(hwnd) {
    if (this._disposed) return { success: false, code: 'DISABLED' };
    const own = this._attachmentOwning(hwnd);
    const target = own ? own.hwnd : (hwnd ? this._probe.rootOwner(hwnd) : 0);
    const existing = this._attachments.get(target);
    if (existing) {
      existing.togglePanel();
      return { success: true, hwnd: existing.hwnd, open: existing.open };
    }
    return this.attach(target);
  }

  applyBindings() {
    const raw = this._deps.settings.get('binding', LumabyteFeature.DEFAULT_BINDING);
    const status = this._bindings.apply({ [LumabyteFeature.ACTION]: raw == null ? '' : String(raw) });
    const s = status[LumabyteFeature.ACTION];
    if (s && s.error) this._deps.log.warn(`shortcut ${s.accelerator || '(none)'} not registered: ${s.error}`);
    return status;
  }

  toggleForeground() {
    if (this._disposed) return { success: false, code: 'DISABLED' };
    if (!this.supported) return this._refuse('Lumabyte needs Windows for now', 'UNSUPPORTED');
    const fg = this._probe.foreground();
    const own = this._attachmentOwning(fg);
    if (own) {
      own.togglePanel();
      return { success: true, hwnd: own.hwnd, open: own.open };
    }
    const target = fg ? this._probe.rootOwner(fg) : 0;
    const existing = this._attachments.get(target);
    if (existing) {
      existing.togglePanel();
      return { success: true, hwnd: existing.hwnd, open: existing.open };
    }
    return this.attach(target);
  }

  attach(hwnd, { open = true } = {}) {
    if (!this.supported) return this._refuse('Lumabyte needs Windows for now', 'UNSUPPORTED');
    if (!hwnd || !this._probe.alive(hwnd)) return this._refuse('Click into an app window first, then press the shortcut', 'NO_WINDOW');
    const already = this._attachments.get(hwnd);
    if (already) {
      if (open) already.openPanel();
      return { success: true, hwnd, open: already.open };
    }
    const app = this._probe.app(hwnd);
    if (app.pid === process.pid) return this._refuse('Lumabyte attaches to other apps; LumaBrowser has its own chat', 'OWN_WINDOW');
    if (LumabyteFeature.SHELL_CLASSES.has(app.className)) return this._refuse('Click into an app window first, then press the shortcut', 'NO_WINDOW');
    if (this._attachments.size >= LumabyteFeature.MAX_ATTACHMENTS) return this._refuse(`Lumabyte is on ${LumabyteFeature.MAX_ATTACHMENTS} windows already; detach one first`, 'TOO_MANY');
    const att = new Attachment({
      hwnd, app, label: app.name, key: ThreadStore.keyFor(app),
      probe: this._probe, windows: this._parts.windows,
      onGone: (a) => this.detach(a.hwnd),
    });
    this._threads.clear(att.key);
    this._attachments.set(hwnd, att);
    att.stopWatching = this._watchLocation(att);
    att.ensureDock();
    if (open) att.openPanel();
    this._ensureTimer();
    this._deps.log.info(`attached to ${app.exe || app.className} (${hwnd})`);
    this._broadcast();
    return { success: true, hwnd, open: att.open, app: app.name };
  }

  detach(hwnd) {
    const att = this._attachments.get(hwnd);
    if (!att) return { success: false, error: 'Not attached to that window', code: 'NOT_ATTACHED' };
    this._attachments.delete(hwnd);
    if (att.stopWatching) att.stopWatching();
    att.dispose();
    if (!this._attachments.size) this._stopTimer();
    this._broadcast();
    return { success: true, hwnd };
  }

  list() {
    return [...this._attachments.values()].map((a) => ({ hwnd: a.hwnd, app: a.app.name, exe: a.app.exe, open: a.open, busy: a.busy }));
  }

  tick() {
    const fg = this._probe.foreground();
    for (const att of [...this._attachments.values()]) att.sync(fg);
  }

  mount(router) {
    router.get('/', (_req, res) => res.json({ success: true, supported: this.supported, attachments: this.list() }));
    router.post('/attach', (req, res) => {
      const hwnd = Number(req.body && req.body.hwnd) || this._probe.foreground();
      const r = this.attach(hwnd, { open: !(req.body && req.body.open === false) });
      res.status(r.success ? 200 : LumabyteFeature.statusFor(r.code)).json(r);
    });
    router.post('/detach', (req, res) => {
      const r = this.detach(Number(req.body && req.body.hwnd));
      res.status(r.success ? 200 : 404).json(r);
    });
  }

  onSettingsChanged(key) {
    if (key === 'binding') this.applyBindings();
  }

  dispose() {
    this._disposed = true;
    this._stopTimer();
    for (const att of this._attachments.values()) { if (att.stopWatching) att.stopWatching(); att.dispose(); }
    this._attachments.clear();
    if (this._parts.events) { try { this._parts.events.dispose(); } catch (_) {} }
    this._bindings.dispose();
    if (this._unhint) this._unhint();
    try { this._threads.flush(); } catch (_) {}
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
    return { UNSUPPORTED: 501, NO_WINDOW: 422, OWN_WINDOW: 422, TOO_MANY: 409 }[code] || 500;
  }


  _registerIpc() {
    const ipc = this._deps.ipc;
    if (!ipc) return;
    const panel = (name, fn) => ipc.handle(`panel.${name}`, (event, data) => {
      const att = this._attachmentFor(event && event.sender);
      if (!att) return { success: false, error: 'Unknown window' };
      return fn(att, data || {});
    });
    panel('state', (att) => ({
      success: true,
      app: att.app.name,
      title: this._probe.title(att.hwnd),
      messages: this._threads.messages(att.key).map((m) => ({ role: m.role, content: m.content })),
      previous: typeof this._threads.previous === 'function' ? this._threads.previous(att.key) : null,
      caps: this._chat.capabilities(),
      busy: att.busy,
    }));
    panel('send', (att, data) => this._send(att, data.text));
    panel('stop', (att) => {
      if (att.turn) att.turn.abort();
      return { success: true };
    });
    panel('clear', (att) => {
      if (att.busy) return { success: false, error: 'Wait for the reply first' };
      this._threads.clear(att.key);
      return { success: true, previous: this._threads.previous(att.key) };
    });
    panel('resume', (att) => {
      if (att.busy) return { success: false, error: 'Wait for the reply first' };
      if (!this._threads.resume(att.key)) return { success: false, error: 'There is no earlier conversation' };
      return { success: true, messages: this._threads.messages(att.key).map((m) => ({ role: m.role, content: m.content })), previous: this._threads.previous(att.key) };
    });
    panel('close', (att) => { att.closePanel(); return { success: true }; });
    panel('detach', (att) => this.detach(att.hwnd));
    panel('openInLuma', (att) => this._openInLuma(att));
    ipc.handle('dock.toggle', (event) => {
      const att = this._attachmentFor(event && event.sender);
      if (!att) return { success: false };
      att.togglePanel();
      return { success: true, open: att.open };
    });
  }

  _send(att, text) {
    if (att.busy) return { success: false, error: 'A reply is still on the way' };
    const prompt = String(text || '').trim();
    if (!prompt) return { success: false, error: 'Type a message first' };
    att.setBusy(true);
    att.turn = this._chat.send(att, prompt, (event) => {
      att.emit(event);
      if (event.type === 'done' || event.type === 'error') {
        att.turn = null;
        att.setBusy(false);
        if (event.type === 'error') this._deps.log.warn(`reply failed: ${event.error}`);
      }
    });
    return { success: true };
  }

  async _openInLuma(att) {
    const handoff = this._deps.handoff;
    if (!handoff) return { success: false, error: 'LumaBrowser chat is not available' };
    const msgs = this._threads.messages(att.key);
    let text = msgs.map((m) => `${m.role === 'user' ? 'You' : 'Lumabyte'}: ${m.content}`).join('\n\n');
    if (text.length > LumabyteFeature.TRANSCRIPT_MAX_CHARS) text = text.slice(-LumabyteFeature.TRANSCRIPT_MAX_CHARS);
    const attachments = text ? [{ kind: 'text', name: `Lumabyte on ${att.app.name}.txt`, text }] : [];
    const r = await handoff.open({ prompt: '', attachments, autoSend: false, source: { client: 'lumabyte', app: att.app.name } });
    return r && r.success === false ? r : { success: true };
  }

  _attachmentFor(webContents) {
    if (!webContents) return null;
    for (const att of this._attachments.values()) if (att.owns(webContents)) return att;
    return null;
  }

  _attachmentOwning(hwnd) {
    if (!hwnd) return null;
    for (const att of this._attachments.values()) if (att.ownHandles().includes(hwnd)) return att;
    return null;
  }

  _ensureTimer() {
    if (this._timer) return;
    const events = this._parts.events;
    if (events && !this._stopSystem) {
      try { this._stopSystem = events.watchSystem(() => this.tick()); } catch (err) { this._deps.log.warn(`window events unavailable: ${(err && err.message) || err}`); }
    }
    this._timer = this._si(() => this.tick(), this._stopSystem ? LumabyteFeature.EVENT_POLL_MS : LumabyteFeature.POLL_MS);
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
  }

  _stopTimer() {
    if (this._timer) this._ci(this._timer);
    this._timer = null;
    if (this._stopSystem) { try { this._stopSystem(); } catch (_) {} }
    this._stopSystem = null;
  }

  _watchLocation(att) {
    const events = this._parts.events;
    if (!events || !att.app.pid) return () => {};
    try {
      return events.watchLocation(att.app.pid, (h) => { if (h === att.hwnd) att.sync(this._probe.foreground()); });
    } catch (err) {
      this._deps.log.warn(`move events unavailable for ${att.app.exe}: ${(err && err.message) || err}`);
      return () => {};
    }
  }

  _broadcast() {
    try { this._deps.broadcast('attachments', { attachments: this.list() }); } catch (_) {}
  }

  _refuse(message, code) {
    const overlay = this._deps.overlay;
    if (overlay) {
      try {
        const s = overlay.show({ kind: 'error', title: 'Lumabyte', detail: message, ring: false, actions: [] });
        s.close({ after: LumabyteFeature.NOTICE_MS });
      } catch (_) {}
    }
    return { success: false, error: message, code };
  }

  _options() {
    const s = this._deps.settings;
    return {
      modelRef: s.get('model', ''),
      screenshot: s.get('screenshot', true) !== false,
      windowText: s.get('windowText', true) !== false,
      thinking: s.get('thinking', false) === true,
      maxActions: LumabyteActions.cap(s.get('maxActions', LumabyteActions.MAX_ACTIONS)),
      actions: s.get('actions', true) !== false,
      files: s.get('files', true) !== false,
    };
  }
}

module.exports = LumabyteFeature;
