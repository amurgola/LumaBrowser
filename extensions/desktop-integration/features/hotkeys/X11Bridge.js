const path = require('path');
const ChordHint = require('./ChordHint');
const X11Keysyms = require('./X11Keysyms');

class X11Bridge {
  static WORKER_PATH = path.join(__dirname, 'X11BridgeWorker.js');
  static SERVICE_NAME = 'luma-x11-bridge';
  static RESTART_MAX = 3;
  static RESTART_DELAY_MS = 2000;
  static MODIFIER_VK = Object.freeze({ Ctrl: 0x11, Alt: 0x12, Shift: 0x10, Super: 0x5b });
  static NOT_STARTED = 'The X11 bridge has not been started.';
  static STARTING = 'The X11 bridge is starting.';
  static GAVE_UP = 'The X11 bridge stopped repeatedly and was not restarted.';

  static forSession({ platform = process.platform, env = process.env, ...options } = {}) {
    if (platform !== 'linux') return null;
    const wayland = !!(env.WAYLAND_DISPLAY || env.XDG_SESSION_TYPE === 'wayland');
    if (!wayland || !env.DISPLAY) return null;
    return new X11Bridge({ env, ...options });
  }

  constructor({ fork = X11Bridge._fork, env = process.env, log = null, setTimeout: st = setTimeout, clearTimeout: ct = clearTimeout } = {}) {
    this._fork = fork;
    this._env = env;
    this._log = log;
    this._setTimeout = st;
    this._clearTimeout = ct;
    this._child = null;
    this._ready = false;
    this._stopped = true;
    this._restarts = 0;
    this._restartTimer = null;
    this._reason = X11Bridge.NOT_STARTED;
    this._held = [];
    this._chords = new Map();
    this._onState = new Set();
  }

  get running() {
    return !!this._child && this._ready;
  }

  get reason() {
    return this.running ? null : this._reason;
  }

  onStateChange(callback) {
    if (typeof callback !== 'function') return () => {};
    this._onState.add(callback);
    return () => { this._onState.delete(callback); };
  }

  start() {
    if (this._child) return;
    this._stopped = false;
    this._spawn();
  }

  stop() {
    this._stopped = true;
    if (this._restartTimer) { this._clearTimeout(this._restartTimer); this._restartTimer = null; }
    const child = this._child;
    this._child = null;
    this._ready = false;
    this._held = [];
    this._reason = X11Bridge.NOT_STARTED;
    if (child) {
      try { child.postMessage({ type: 'stop' }); } catch (_) {}
      try { child.kill(); } catch (_) {}
    }
  }

  register(accelerator, callback) {
    const chord = X11Bridge.chordOf(accelerator);
    if (!chord) throw new Error(`the X11 bridge cannot watch "${accelerator}"`);
    this._chords.set(accelerator, { ...chord, callback });
    this._syncChords();
    return true;
  }

  unregister(accelerator) {
    if (this._chords.delete(accelerator)) this._syncChords();
  }

  unregisterAll() {
    this._chords.clear();
    this._syncChords();
  }

  isRegistered(accelerator) {
    return this._chords.has(accelerator);
  }

  heldModifiers() {
    return [...this._held];
  }

  sendCombo(names) {
    this._send({ type: 'inject', names });
  }

  releaseKeys(vks) {
    this._send({ type: 'release', vks });
  }

  static chordOf(accelerator) {
    const split = ChordHint.split(accelerator);
    if (!split) return null;
    const keysym = X11Keysyms.keysym(split.key);
    if (!keysym) return null;
    const modifiers = split.modifiers.split('+').map((m) => X11Bridge.MODIFIER_VK[m]).filter(Boolean).sort((a, b) => a - b);
    return { id: String(accelerator), modifiers, keysym };
  }

  _spawn() {
    this._reason = X11Bridge.STARTING;
    let child;
    try {
      child = this._fork(X11Bridge.WORKER_PATH, X11Bridge.SERVICE_NAME);
    } catch (err) {
      this._reason = `The X11 bridge could not start: ${(err && err.message) || err}`;
      this._warn(this._reason);
      this._changed();
      return;
    }
    this._child = child;
    this._ready = false;
    child.on('message', (message) => this._onMessage(message));
    child.on('exit', (code) => this._onExit(child, code));
  }

  _onMessage(message) {
    const m = message || {};
    if (m.type === 'ready') {
      this._ready = true;
      this._restarts = 0;
      this._reason = null;
      this._syncChords();
      this._changed();
      return;
    }
    if (m.type === 'held') { this._held = Array.isArray(m.vks) ? m.vks.map(Number) : []; return; }
    if (m.type === 'fire') { this._fire(m.id); return; }
    if (m.type === 'chords') {
      for (const id of m.unmapped || []) this._warn(`the X11 bridge found no key for ${id} on this keyboard layout`);
      return;
    }
    if (m.type === 'error') { this._reason = String(m.message || 'The X11 bridge failed.'); this._warn(this._reason); }
  }

  _fire(id) {
    const chord = this._chords.get(id);
    if (!chord || typeof chord.callback !== 'function') return;
    try { chord.callback(); } catch (err) { this._warn(`shortcut ${id} failed: ${(err && err.message) || err}`); }
  }

  _onExit(child, code) {
    if (child !== this._child) return;
    this._child = null;
    this._ready = false;
    this._held = [];
    if (this._stopped) return;
    if (this._restarts >= X11Bridge.RESTART_MAX) {
      this._reason = X11Bridge.GAVE_UP;
      this._warn(`${this._reason} (last exit code ${code})`);
      this._changed();
      return;
    }
    this._restarts += 1;
    this._reason = `The X11 bridge exited (code ${code}); restarting.`;
    this._changed();
    this._restartTimer = this._setTimeout(() => { this._restartTimer = null; if (!this._stopped) this._spawn(); }, X11Bridge.RESTART_DELAY_MS);
  }

  _syncChords() {
    if (!this.running) return;
    const chords = [...this._chords.values()].map(({ id, modifiers, keysym }) => ({ id, modifiers, keysym }));
    this._send({ type: 'chords', chords });
  }

  _send(message) {
    if (!this._child) return;
    try { this._child.postMessage(message); } catch (_) {}
  }

  _changed() {
    for (const fn of this._onState) { try { fn(); } catch (_) {} }
  }

  _warn(text) {
    if (this._log && typeof this._log.warn === 'function') this._log.warn(`[x11-bridge] ${text}`);
  }

  static _fork(workerPath, serviceName) {
    const RamPinWorkerLauncher = require('../../../../core/shared/runtime/rampin/RamPinWorkerLauncher');
    return RamPinWorkerLauncher.fork(workerPath, serviceName);
  }
}

module.exports = X11Bridge;
