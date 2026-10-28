const HotkeyActions = require('./HotkeyActions');
const HotkeyActivity = require('./HotkeyActivity');
const ChordHint = require('./ChordHint');
const HintTarget = require('./HintTarget');
const HotkeyBindings = require('./HotkeyBindings');
const SelectionKeys = require('./SelectionKeys');
const RegionCapture = require('./RegionCapture');
const RegionOverlay = require('./RegionOverlay');
const ScreenTextReader = require('./ScreenTextReader');
const SelectionClipboard = require('./SelectionClipboard');
const SelectionRewriter = require('./SelectionRewriter');
const X11Bridge = require('./X11Bridge');
const KWinHintTarget = require('./KWinHintTarget');

class HotkeysFeature {
  static ACTIONS = [
    { id: 'read-selection', label: 'Read selection aloud', defaultBinding: 'Ctrl+Alt+Shift+R', description: 'Speaks the text selected in the app in front; press again to stop.' },
    { id: 'rewrite-selection', label: 'Rewrite selection', defaultBinding: 'Ctrl+Alt+Shift+E', description: 'Rewrites the selected text with the model and pastes it over the selection.' },
    { id: 'clipboard-to-chat', label: 'Clipboard to chat', defaultBinding: 'Ctrl+Alt+Shift+V', description: 'Opens a new chat with the clipboard text or image.' },
    { id: 'screenshot-to-chat', label: 'Screen region to chat', defaultBinding: 'Ctrl+Alt+Shift+S', description: 'Drag a rectangle on screen; it opens in a new chat as an image.' },
  ];

  static BINDING_PREFIX = 'binding.';
  static HINT_LABELS = { 'read-selection': 'Read aloud', 'rewrite-selection': 'Rewrite', 'clipboard-to-chat': 'Clipboard to chat', 'screenshot-to-chat': 'Screen region' };
  static HINT_CAPTION = 'Press a key. To work on one window only, click it first.';
  static TITLE_CHARS = 40;
  static REPEAT_MS = 400;
  static INTRO_KEY = 'hintIntroduced';
  static INTRO_TITLE = 'Luma is one chord away in every app';
  static STATUS = { UNKNOWN_ACTION: 400, UNSUPPORTED: 501, BUSY: 409, CANCELED: 409, NO_SELECTION: 422, EMPTY_CLIPBOARD: 422, EMPTY: 422, TOO_LONG: 422, NO_TTS: 503, NO_MODEL: 503, TIMEOUT: 504, FOCUS_LOST: 409, NO_PERMISSION: 403 };
  static QUIET = new Set(['CANCELED', 'BUSY']);

  static settingsSchema() {
    const bindings = HotkeysFeature.ACTIONS.map((a) => ({
      key: HotkeysFeature.BINDING_PREFIX + a.id,
      label: a.label,
      type: 'hotkey',
      default: a.defaultBinding,
      help: `${a.description} Empty = no shortcut (REST still works).`,
    }));
    return [
      ...bindings,
      { key: 'rewriteInstruction', label: 'Rewrite instruction', type: 'textarea', default: SelectionRewriter.DEFAULT_INSTRUCTION, help: 'The system prompt the selected text is rewritten with.' },
      { key: 'rewriteModel', label: 'Rewrite model', type: 'text', default: '', help: 'A chat model reference (as in the chat model picker). Empty uses the chat\'s current model.' },
      { key: 'rewriteTimeoutSec', label: 'Rewrite timeout (seconds)', type: 'number', default: 60, min: 5, max: 600 },
      { key: 'readScreen', label: 'Read text off the screen when nothing is selected', type: 'bool', default: true, help: 'Read aloud with no selection lets you drag over text on screen (or reads the window picked on the shortcut hint) and has the model read it. Needs a chat model that can see images.' },
      { key: 'screenTextModel', label: 'Screen text model', type: 'text', default: '', help: 'A chat model that can see images, for reading text off the screen. Empty uses the chat\'s current model.' },
      { key: 'autoSend', label: 'Send to the chat right away', type: 'bool', default: false, help: 'Clipboard and screenshot handoffs send the turn instead of waiting in the composer.' },
      { key: 'overlayIsland', label: 'Show the activity island', type: 'bool', default: true, help: 'A pill at the top of the screen while an action runs, with Pause, Stop and Continue in LumaBrowser for reading aloud. Failures show there too.' },
      { key: 'shortcutHints', label: 'Show the shortcut keys while the modifiers are held', type: 'bool', default: true, help: 'Hold Ctrl+Alt+Shift (or whatever your shortcuts share) for a moment: the screen edge lights up and the island lists the keys you can press next. Click a window while holding them to aim the actions at that window only. Needs the activity island.' },
      { key: 'overlayRing', label: 'Light the screen edge while active', type: 'bool', default: true, help: 'A soft glow around the monitor you are working on while Luma reads or rewrites.' },
      { key: 'waylandBridge', label: 'Wayland: watch the keyboard through XWayland', type: 'bool', default: true, help: 'Linux Wayland desktops only. Electron cannot register global shortcuts there, so a small helper beside the app watches the keys the way X11 apps do (through XWayland) and runs the shortcuts and the shortcut hint. Works on KDE Plasma with no desktop setting; the focused app still receives the chord too.' },
      { key: 'notifyFailures', label: 'Show a notification when an action fails', type: 'bool', default: true, help: 'Used when the activity island is off.' },
    ];
  }

  static defaultParts(deps = {}) {
    const electron = require('electron');
    const ExtensionGlobals = require('../../../../core/shell/extensions/ExtensionGlobals');
    const win = process.platform === 'win32' ? require('../../../../core/desktop/Win32') : null;
    const bridge = deps.bridge !== undefined ? deps.bridge : X11Bridge.forSession({ log: console });
    return {
      globalShortcut: electron.globalShortcut,
      bridge,
      hintTarget: deps.hintTarget !== undefined ? deps.hintTarget : KWinHintTarget.forSession(),
      clipboard: electron.clipboard,
      keys: SelectionKeys.create({ clipboard: electron.clipboard, bridge }),
      getRouter: () => ExtensionGlobals.chatRouter(),
      region: new RegionCapture({ electron, win, overlay: new RegionOverlay({ BrowserWindow: electron.BrowserWindow }) }),
      notify: (title, body) => HotkeysFeature._electronNotify(electron, title, body),
    };
  }

  constructor(deps, parts) {
    this._deps = deps;
    this._parts = parts;
    this._notify = parts.notify || (() => {});
    const selection = new SelectionClipboard({ keys: parts.keys, clipboard: parts.clipboard, sleep: parts.sleep, now: parts.now });
    this._activity = new HotkeyActivity({
      overlay: deps.overlay || null,
      speech: deps.speech,
      handoff: deps.handoff,
      options: () => ({ island: deps.settings.get('overlayIsland', true) !== false, ring: deps.settings.get('overlayRing', true) !== false }),
      stopSpeaking: () => this._actions.stopSpeaking(),
      log: deps.log,
    });
    this._target = parts.hintTarget || new HintTarget({ keys: parts.keys });
    this._hint = null;
    this._actions = new HotkeyActions({
      speech: deps.speech,
      handoff: deps.handoff,
      selection,
      rewriter: new SelectionRewriter({ getRouter: parts.getRouter }),
      region: parts.region,
      clipboard: parts.clipboard,
      screenText: parts.screenText || new ScreenTextReader({ getRouter: parts.getRouter }),
      options: () => this._options(),
      onError: (id, message, shown) => this._report(id, { success: false, error: message, shown: !!shown }),
      now: parts.now,
      activity: this._activity,
    });
    this._bindings = this._newBindings();
    if (parts.bridge && typeof parts.bridge.onStateChange === 'function') parts.bridge.onStateChange(() => this._bridgeChanged());
    this._chord = new ChordHint({
      held: () => parts.keys.heldModifiers(),
      groups: () => this._hintGroups(),
      onShow: (modifiers, entries) => { this._target.begin(); this._showHint(modifiers, entries); },
      onHide: () => { this._hint = null; this._target.end(); if (deps.overlay) deps.overlay.unpeek(); },
      onPoll: () => this._pollTarget(),
      now: parts.now,
    });
    this._contributed = new Map();
    this._unhost = deps.hints
      ? deps.hints.setHost({ dismiss: () => this._chord.suppress(), target: () => this._target.framed || 0 })
      : null;
    this._disposed = false;
    this._now = parts.now || Date.now;
    this._lastFire = new Map();
  }

  get actions() {
    return this._actions;
  }

  start() {
    this._applyBridge();
    this.applyBindings();
    if (this._applyHint()) this._introduceHint();
  }

  _bridgeWanted() {
    return !!this._parts.bridge && this._deps.settings.get('waylandBridge', true) !== false;
  }

  _shortcutBackend() {
    return this._bridgeWanted() ? this._parts.bridge : this._parts.globalShortcut;
  }

  _newBindings() {
    return new HotkeyBindings({ globalShortcut: this._shortcutBackend(), onFire: (id) => this.fire(id), log: this._deps.log });
  }

  _applyBridge() {
    const bridge = this._parts.bridge;
    if (!bridge) return;
    if (this._bridgeWanted() && !this._disposed) bridge.start();
    else bridge.stop();
  }

  _bridgeChanged() {
    if (this._disposed) return;
    const bridge = this._parts.bridge;
    if (bridge && !bridge.running && bridge.reason) this._deps.log.warn(`shortcut hint paused: ${bridge.reason}`);
    if (this._applyHint()) this._introduceHint();
  }

  _switchBackend() {
    this._bindings.unregisterAll();
    this._applyBridge();
    this._bindings = this._newBindings();
    this.applyBindings();
    this._applyHint();
  }

  bridgeStatus() {
    const bridge = this._parts.bridge;
    if (!bridge) return null;
    return { wanted: this._bridgeWanted(), running: !!bridge.running, reason: bridge.running ? null : (bridge.reason || null) };
  }

  _applyHint() {
    const want = !this._disposed && !this.hintUnavailableReason();
    if (want) this._chord.start();
    else this._chord.stop();
    return want;
  }

  hintUnavailableReason() {
    const keys = this._parts.keys;
    const s = this._deps.settings;
    if (!this._deps.overlay) return 'The activity overlay is not available.';
    if (!keys || typeof keys.heldModifiers !== 'function' || keys.supported === false) return 'This platform cannot read which keys are held.';
    if (keys.pollsModifiers === false) return keys.hintUnavailableReason || 'This session cannot read which keys are held.';
    if (s.get('overlayIsland', true) === false) return 'The activity island is off (setting).';
    if (s.get('shortcutHints', true) === false) return 'The shortcut hint is off (setting).';
    return null;
  }

  _introduceHint() {
    const s = this._deps.settings;
    if (s.get(HotkeysFeature.INTRO_KEY, false) === true) return false;
    const modifiers = Object.keys(this._hintGroups())[0] || 'Ctrl+Alt+Shift';
    try { this._notify(HotkeysFeature.INTRO_TITLE, HotkeysFeature.introBody(modifiers)); } catch (_) {}
    s.set(HotkeysFeature.INTRO_KEY, true);
    return true;
  }

  static introBody(modifiers) {
    return `Hold ${modifiers.split('+').join(' + ')} for a moment in any app to see what Luma can do there: read aloud, rewrite, send to chat, attach Lumabyte, and pause or stop a desktop run.`;
  }

  _hintGroups() {
    const groups = {};
    const status = this._bindings.status();
    const framed = !!this._target.framed;
    for (const a of HotkeysFeature.ACTIONS) {
      const st = status[a.id];
      const split = st && st.registered ? ChordHint.split(st.accelerator) : null;
      if (!split) continue;
      let label = HotkeysFeature.HINT_LABELS[a.id];
      if (a.id === 'read-selection' && this._actions.speaking()) label = 'Stop reading';
      if (a.id === 'screenshot-to-chat' && framed) label = 'Capture window';
      const { disabled, note } = this._actions.readiness(a.id, { framed });
      (groups[split.modifiers] = groups[split.modifiers] || []).push({ id: a.id, key: split.key, label, disabled, note });
    }
    this._contributed = new Map();
    const hints = this._deps.hints;
    const context = { framed: this._target.framed || 0, hwnd: this._hint ? this._hint.hwnd : 0 };
    for (const e of hints ? hints.entries(context) : []) {
      const split = ChordHint.split(e.accelerator);
      if (!split || this._contributed.has(e.id)) continue;
      this._contributed.set(e.id, e);
      (groups[split.modifiers] = groups[split.modifiers] || []).push({ id: e.id, key: split.key, label: e.label, disabled: !!e.disabled, note: e.note || '' });
    }
    return groups;
  }

  _showHint(modifiers, entries) {
    const overlay = this._deps.overlay;
    if (!overlay) return;
    let hwnd = 0;
    try { hwnd = this._parts.keys.foregroundWindow ? this._parts.keys.foregroundWindow() : 0; } catch (_) { hwnd = 0; }
    this._hint = { modifiers, hwnd };
    this._peekHint(entries);
  }

  _peekHint(entries) {
    const hint = this._hint;
    const framed = this._target.framed;
    this._deps.overlay.peek({
      kind: 'keys',
      hint: `${hint.modifiers.split('+').join(' + ')} +`,
      keys: entries,
      caption: framed ? this._framedCaption(framed) : HotkeysFeature.HINT_CAPTION,
      ring: this._deps.settings.get('overlayRing', true) !== false,
      hwnd: framed || hint.hwnd,
      frame: framed || 0,
    }, (id) => {
      const source = this._hintSource();
      this._chord.suppress();
      const contributed = this._contributed.get(id);
      if (contributed) {
        Promise.resolve().then(() => contributed.run({ via: 'hint', ...source, hwnd: source.hwnd || (this._hint ? this._hint.hwnd : 0) }))
          .catch((err) => this._deps.log.warn(`${id} from the hint failed: ${(err && err.message) || err}`));
        return;
      }
      this.run(id, { via: 'hint', client: 'hotkeys', ...source }).catch(() => {});
    });
  }

  _pollTarget() {
    if (!this._hint || !this._deps.overlay) return;
    if (this._target.poll() === null) return;
    const entries = this._hintGroups()[this._hint.modifiers];
    if (entries && entries.length) this._peekHint(entries);
  }

  _hintSource() {
    const hwnd = this._target.framed;
    if (!hwnd || !this._deps.overlay || typeof this._deps.overlay.frameOf !== 'function') return {};
    const frame = this._deps.overlay.frameOf(hwnd);
    return frame ? { hwnd, frame } : {};
  }

  _framedCaption(hwnd) {
    let title = '';
    try {
      if (typeof this._target.titleOf === 'function') title = String(this._target.titleOf(hwnd) || '');
      if (!title && this._parts.keys.windowTitle) title = String(this._parts.keys.windowTitle(hwnd) || '');
    } catch (_) { title = ''; }
    title = title.replace(/\s+/g, ' ').trim();
    if (title.length > HotkeysFeature.TITLE_CHARS) title = `${title.slice(0, HotkeysFeature.TITLE_CHARS - 3).trimEnd()}...`;
    return `${title ? `Working on ${title}` : 'Working on this window'}. Click the desktop for the whole screen.`;
  }

  applyBindings() {
    const status = this._bindings.apply(this._readBindings());
    for (const [action, s] of Object.entries(status)) {
      if (s.error) this._deps.log.warn(`shortcut ${s.accelerator || '(none)'} for ${action} not registered: ${s.error}`);
    }
    return status;
  }

  fire(id) {
    const source = this._hintSource();
    this._chord.suppress();
    const now = this._now();
    if (this._lastFire.has(id) && now - this._lastFire.get(id) < HotkeysFeature.REPEAT_MS) return Promise.resolve({ success: false, code: 'REPEAT' });
    this._lastFire.set(id, now);
    return this.run(id, { via: 'hotkey', client: 'hotkeys', ...source }).catch((err) => this._deps.log.error(`${id} crashed: ${(err && err.message) || err}`));
  }

  async run(id, source = {}) {
    if (this._disposed) return { success: false, error: 'The hotkeys feature is off', code: 'DISABLED' };
    const result = await this._actions.run(id, source);
    this._report(id, result, source);
    return result;
  }

  describe() {
    const status = this._bindings.status();
    return {
      platform: process.platform,
      actions: HotkeysFeature.ACTIONS.map((a) => {
        const s = status[a.id] || { accelerator: '', registered: false, error: null };
        return {
          id: a.id,
          label: a.label,
          description: a.description,
          supported: this._actions.supported(a.id),
          binding: s.accelerator,
          registered: s.registered,
          conflict: s.error,
        };
      }),
      busy: this._actions.busy(),
      speaking: this._actions.speaking(),
      hint: { on: this._chord.running, reason: this.hintUnavailableReason() },
      bridge: this.bridgeStatus(),
    };
  }

  mount(router) {
    router.get('/', (_req, res) => res.json({ success: true, ...this.describe() }));
    router.post('/run', async (req, res) => {
      const action = req.body && typeof req.body.action === 'string' ? req.body.action.trim() : '';
      if (!action) return res.status(400).json({ success: false, error: 'action is required', actions: HotkeyActions.IDS });
      if (!HotkeyActions.IDS.includes(action)) {
        return res.status(400).json({ success: false, error: `Unknown action "${action}"`, actions: HotkeyActions.IDS });
      }
      const client = (typeof req.get === 'function' && req.get('X-Luma-Client')) || 'rest';
      const result = await this.run(action, { via: 'rest', client });
      return res.status(result.success ? 200 : HotkeysFeature.statusFor(result.code)).json(result);
    });
  }

  onSettingsChanged(key) {
    if (String(key).startsWith(HotkeysFeature.BINDING_PREFIX)) this.applyBindings();
    if (key === 'shortcutHints' || key === 'overlayIsland') this._applyHint();
    if (key === 'waylandBridge') this._switchBackend();
  }

  dispose() {
    this._disposed = true;
    if (this._parts.bridge) { try { this._parts.bridge.stop(); } catch (_) {} }
    if (this._unhost) this._unhost();
    this._chord.stop();
    this._bindings.dispose();
    try { if (this._parts.region) this._parts.region.cancel(); } catch (_) {}
    this._actions.dispose();
  }

  instance() {
    return {
      mount: (router) => this.mount(router),
      onSettingsChanged: (key, value) => this.onSettingsChanged(key, value),
      dispose: () => this.dispose(),
    };
  }

  static statusFor(code) {
    return HotkeysFeature.STATUS[code] || 500;
  }

  _readBindings() {
    const out = {};
    for (const a of HotkeysFeature.ACTIONS) {
      const value = this._deps.settings.get(HotkeysFeature.BINDING_PREFIX + a.id, a.defaultBinding);
      out[a.id] = value == null ? '' : String(value);
    }
    return out;
  }

  _options() {
    const s = this._deps.settings;
    const sec = Number(s.get('rewriteTimeoutSec', 60));
    return {
      instruction: s.get('rewriteInstruction', SelectionRewriter.DEFAULT_INSTRUCTION),
      modelRef: s.get('rewriteModel', ''),
      timeoutMs: Math.round((Number.isFinite(sec) && sec > 0 ? Math.min(sec, 600) : 60) * 1000),
      autoSend: s.get('autoSend', false) === true,
      readScreen: s.get('readScreen', true) !== false,
      screenTextModel: s.get('screenTextModel', ''),
    };
  }

  _report(id, result, source = {}) {
    try { this._deps.broadcast('action', { action: id, via: source.via || null, success: !!result.success, code: result.code || null, error: result.error || null }); } catch (_) {}
    if (result.success || HotkeysFeature.QUIET.has(result.code)) return;
    this._deps.log.warn(`${id} failed: ${result.error}`);
    if (result.shown) return;
    if (this._deps.settings.get('overlayIsland', true) !== false && this._activity.flash({ action: id, result })) return;
    if (this._deps.settings.get('notifyFailures', true) === false) return;
    const label = (HotkeysFeature.ACTIONS.find((a) => a.id === id) || { label: id }).label;
    try { this._notify(`Luma: ${label}`, String(result.error || 'Failed')); } catch (_) {}
  }

  static _electronNotify(electron, title, body) {
    const { Notification } = electron;
    if (!Notification || typeof Notification.isSupported !== 'function' || !Notification.isSupported()) return;
    new Notification({ title, body, silent: true }).show();
  }
}

module.exports = HotkeysFeature;
