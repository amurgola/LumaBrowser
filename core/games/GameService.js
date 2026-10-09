const AntiCheatDetector = require('../desktop/AntiCheatDetector');
const GameId = require('./GameId');
const GameMacroRunner = require('./GameMacroRunner');

class GameService {
  static DEFAULT_SETTLE_MS = 250;
  static NO_SESSION = 'No game session. Call game_start_session with the game window first.';
  static CAPTURE_REGION_NOTE = 'CAPTURE: the game does not render into window capture (typical for Direct3D); using the on-screen region. Keep it in borderless windowed mode and uncovered.';
  static NEXT_ALLOW = 'NEXT: call game_allow so the user can approve game mode for this game; no input is sent until they do.';
  static LOOP_HINT = 'LOOP: act (game_press / game_hold / game_click / game_mouse_move) -> game_wait (screenshot) -> plan. Keep goals and notes current.';

  constructor({ controller, store, sleep = GameService._realSleep, settleMs = GameService.DEFAULT_SETTLE_MS }) {
    this._controller = controller;
    this._store = store;
    this._sleep = sleep;
    this._settleMs = settleMs;
    this._active = null;
    this._macros = new GameMacroRunner({ controller, sleep });
  }

  get desktop() {
    return this._controller.desktop;
  }

  start(args = {}) {
    const gate = this.desktop.gate();
    if (gate) return { success: false, error: gate };
    const { w, error } = this.desktop.resolve(args);
    if (error) return { success: false, error };
    const exe = this._exeOf(w);
    const refusal = GameService._gameRefusal(w, exe);
    if (refusal) return { success: false, error: refusal };
    const opened = this._openSession(args.gameId, w, exe);
    if (opened.error) return { success: false, error: opened.error };
    return this._briefing(opened.s, w, exe);
  }

  allow() {
    const gate = this.desktop.gate();
    if (gate) return { success: false, error: gate };
    const { s, w, error } = this._session();
    if (error) return { success: false, error };
    const exe = this._exeOf(w);
    const refusal = GameService._gameRefusal(w, exe);
    if (refusal) return { success: false, error: refusal };
    s.allow(exe);
    return { success: true, data: { gameId: s.gameId, allowed: true, exe } };
  }

  press(args = {}) {
    return this._step(`press ${[].concat(args.keys).join(' ')}`, (w) => this._controller.pressKeys(GameService._on(w, args)));
  }

  hold(args = {}) {
    return this._step(`hold ${args.key} ${args.ms || 500}ms`, (w) => this._controller.holdKey(GameService._on(w, args)));
  }

  mouseMove(args = {}) {
    return this._step(`mouse ${args.dx || 0},${args.dy || 0}`, (w) => this._controller.moveMouseRelative(GameService._on(w, args)));
  }

  click(args = {}) {
    const where = args.description ? `"${args.description}"` : `${args.x},${args.y}`;
    return this._step(`click ${where}`, (w) => this._controller.clickUI(GameService._on(w, args)));
  }

  async calibrateMouse(args = {}) {
    const { s, w, error } = this._ready();
    if (error) return { success: false, error };
    const r = await this._controller.calibrateMouse(GameService._on(w, args));
    if (r.success) s.addNote({ kind: 'calibration', text: r.data.advice });
    return r;
  }

  async wait(args = {}) {
    const gate = this.desktop.gate();
    if (gate) return { success: false, error: gate };
    const { s, w, error } = this._session();
    if (error) return { success: false, error };
    const mode = args.for === 'change' ? 'change' : 'still';
    const r = await this._waitFor(mode, s, w, args);
    if (!r.success) return r;
    s.lastHash = r.data.hash;
    return { success: true, data: this._waitData(mode, r.data, s, w, args.screenshot !== false) };
  }

  setGoals(args = {}) {
    const { s, error } = this._session();
    if (error) return { success: false, error };
    return { success: true, data: { goals: s.setGoals(args) } };
  }

  note(args = {}) {
    const { s, error } = this._session();
    if (error) return { success: false, error };
    if (!GameService._isNote(args)) return { success: false, error: 'text is required (or kind "control" with key and action).' };
    s.addNote(args);
    return { success: true, data: { notes: s.profile.notes.length, status: s.status() } };
  }

  saveMacro(args = {}) {
    const { s, error } = this._session();
    if (error) return { success: false, error };
    try {
      const name = s.saveMacro(args.name, args.steps);
      return { success: true, data: { name, steps: args.steps.length } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async runMacro(args = {}) {
    const { s, w, error } = this._ready();
    if (error) return { success: false, error };
    const steps = s.getMacro(args.name);
    if (!steps) return { success: false, error: GameService._unknownMacro(args.name, s) };
    const r = await this._macros.run(args.name, steps, w.hwnd);
    if (!r.success) return r;
    return { success: true, data: { macro: args.name, steps: steps.length, step: await this._afterStep(s, `macro ${args.name}`) } };
  }

  status() {
    const { s, error } = this._session();
    if (error) return { success: false, error };
    return { success: true, data: { gameId: s.gameId, goals: s.profile.goals, ...s.status() } };
  }

  _exeOf(w) {
    try { return this.desktop.win.processImagePath(w.pid); } catch (_) { return null; }
  }

  _openSession(gameId, w, exe) {
    let s;
    try {
      s = this._store.open(gameId || GameId.from({ exe, title: w.title }));
    } catch (e) {
      return { error: e.message };
    }
    s.hwnd = w.hwnd;
    s.profile.title = w.title;
    s.profile.exe = exe;
    s.save();
    this._active = s;
    return { s };
  }

  _briefing(s, w, exe) {
    const lines = [s.describe(), ...this._captureLines(s, w)];
    const allowed = s.isAllowedFor(exe);
    lines.push(allowed ? GameService.LOOP_HINT : GameService.NEXT_ALLOW);
    return { success: true, data: { gameId: s.gameId, hwnd: w.hwnd, allowed, text: lines.join('\n'), status: s.status() } };
  }

  _captureLines(s, w) {
    const h = this._controller.frameHash({ hwnd: w.hwnd });
    if (!h.success) return [`CAPTURE: failed (${h.error}).`];
    s.lastHash = h.data.hash;
    return h.data.method === 'screen-region' ? [GameService.CAPTURE_REGION_NOTE] : [];
  }

  _session() {
    if (!this._active) return { error: GameService.NO_SESSION };
    const { w, error } = this.desktop.resolve({ hwnd: this._active.hwnd });
    if (error) return { error: `${error} Call game_start_session again.` };
    return { s: this._active, w };
  }

  _ready() {
    const gate = this.desktop.gate();
    if (gate) return { error: gate };
    const { s, w, error } = this._session();
    if (error) return { error };
    const exe = this._exeOf(w);
    const refusal = GameService._gameRefusal(w, exe);
    if (refusal) return { error: refusal };
    if (!s.isAllowedFor(exe)) return { error: `The user has not allowed game mode for "${w.title}". Call game_allow first (the user approves it).` };
    return { s, w };
  }

  async _step(action, fn) {
    const { s, w, error } = this._ready();
    if (error) return { success: false, error };
    const r = await fn(w);
    if (!r.success) return r;
    return { success: true, data: { ...r.data, step: await this._afterStep(s, action) } };
  }

  async _afterStep(s, action) {
    await this._sleep(this._settleMs);
    const prev = s.lastHash;
    const h = this._controller.frameHash({ hwnd: s.hwnd });
    const hash = h.success ? h.data.hash : null;
    const step = s.recordStep({ hash, action });
    if (hash && prev) step.changed = this._controller.diff(prev, hash);
    return step;
  }

  _waitFor(mode, s, w, args) {
    if (mode === 'change') {
      return this._controller.waitForChange({ hwnd: w.hwnd, timeoutMs: args.timeoutMs, since: s.lastHash || undefined, minDistance: args.minDistance });
    }
    return this._controller.waitForStill({ hwnd: w.hwnd, timeoutMs: args.timeoutMs, stableMs: args.stableMs });
  }

  _waitData(mode, result, s, w, withScreenshot) {
    const data = { for: mode, ...result, status: s.status() };
    delete data.hash;
    if (!withScreenshot) return data;
    const shot = this.desktop.screenshot({ hwnd: w.hwnd });
    if (shot.success) data.image = shot.data;
    return data;
  }

  static _gameRefusal(w, exe) {
    if (!exe) return `Could not read the executable of "${w.title}", so anti-cheat can't be ruled out. Game mode will not drive it.`;
    const antiCheat = AntiCheatDetector.detect(exe);
    if (antiCheat) return `Refusing game mode for "${w.title}": it is protected by ${antiCheat}. Automated input there is treated as cheating and can get the user's account banned.`;
    return null;
  }

  static _on(w, args) {
    return { ...args, hwnd: w.hwnd, window: undefined };
  }

  static _isNote(args) {
    return !!String(args.text || '').trim() || (args.kind === 'control' && !!args.key && !!args.action);
  }

  static _unknownMacro(name, s) {
    const known = Object.keys(s.profile.macros);
    return `No macro "${name}".${known.length ? ` Known: ${known.join(', ')}.` : ''}`;
  }

  static _realSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = GameService;
