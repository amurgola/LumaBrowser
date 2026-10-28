const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const X11Api = require('./X11Api');

class LinuxKeys {
  static MODIFIERS = [[0x10, ['Shift_L', 'Shift_R']], [0x11, ['Control_L', 'Control_R']], [0x12, ['Alt_L', 'Alt_R']], [0x5b, ['Super_L', 'Super_R']]];
  static COMBOS = { copy: 'c', paste: 'v' };
  static WAYLAND_TOOLS = [
    { bin: 'wtype', args: (key) => ['-M', 'ctrl', key, '-m', 'ctrl'] },
    { bin: 'ydotool', args: (key) => ['key', '29:1', `${LinuxKeys.EVDEV[key]}:1`, `${LinuxKeys.EVDEV[key]}:0`, '29:0'] },
  ];
  static EVDEV = { c: 46, v: 47 };
  static TOOL_TIMEOUT_MS = 2000;
  static NO_PASTE = 'Pasting into other apps on Wayland needs wtype or ydotool installed';

  constructor({ platform = process.platform, env = process.env, clipboard = null, bridge = null, loadX11 = () => X11Api.load(), findTool = LinuxKeys._findOnPath, run = LinuxKeys._run } = {}) {
    this._platform = platform;
    this._bridge = bridge;
    this._env = env;
    this._clipboard = clipboard;
    this._loadX11 = loadX11;
    this._findTool = findTool;
    this._run = run;
    this._mode = undefined;
    this._tool = undefined;
  }

  get session() {
    if (this._mode !== undefined) return this._mode;
    const env = this._env || {};
    if (this._platform !== 'linux') this._mode = null;
    else if (env.WAYLAND_DISPLAY || env.XDG_SESSION_TYPE === 'wayland') this._mode = 'wayland';
    else if (env.DISPLAY) this._mode = 'x11';
    else this._mode = null;
    return this._mode;
  }

  get supported() {
    return !!this.session;
  }

  get pollsModifiers() {
    if (this.session === 'x11') return true;
    return this.session === 'wayland' && this._bridgeRunning();
  }

  static NO_WAYLAND_POLL = 'On Wayland no app can read which keys are held, so the shortcut hint is off (the shortcuts still work where the compositor allows global shortcuts).';

  get hintUnavailableReason() {
    if (this.session === 'wayland') {
      if (this._bridgeRunning()) return null;
      return this._bridge ? (this._bridge.reason || 'The X11 bridge is not running.') : LinuxKeys.NO_WAYLAND_POLL;
    }
    if (!this.session) return 'No display session was found.';
    return this.unavailableReason();
  }

  get bridge() {
    return this._bridge;
  }

  _bridgeRunning() {
    return !!(this._bridge && this._bridge.running);
  }

  get copyMode() {
    return this.session === 'wayland' ? 'primary' : 'keys';
  }

  unavailableReason() {
    if (this.session !== 'x11') return null;
    try {
      this._loadX11();
      return null;
    } catch (err) {
      return `Sending keys needs the X11 libraries (libX11, libXtst): ${(err && err.message) || err}`;
    }
  }

  canPaste() {
    return this.session === 'x11' || this._bridgeRunning() || !!this._waylandTool();
  }

  get noPasteReason() {
    return LinuxKeys.NO_PASTE;
  }

  readPrimary() {
    try { return this._clipboard ? String(this._clipboard.readText('selection') || '') : ''; } catch (_) { return ''; }
  }

  heldModifiers() {
    if (this.session === 'wayland') return this._bridgeRunning() ? this._bridge.heldModifiers() : [];
    if (this.session !== 'x11') return [];
    const api = this._loadX11();
    const down = api.keysDown();
    return LinuxKeys.MODIFIERS.filter(([, names]) => names.some((n) => down(api.keycode(n)))).map(([vk]) => vk);
  }

  releaseKeys(vks) {
    if (this.session === 'wayland') { if (this._bridgeRunning()) this._bridge.releaseKeys(vks); return; }
    if (this.session !== 'x11') return;
    const api = this._loadX11();
    for (const [vk, names] of LinuxKeys.MODIFIERS) {
      if (vks.includes(vk)) for (const n of names) api.key(api.keycode(n), false);
    }
    api.flush();
  }

  clipboardSequence() {
    try { return this._clipboard ? String(this._clipboard.readText() || '') : ''; } catch (_) { return ''; }
  }

  foregroundWindow() {
    return this.session === 'x11' ? this._loadX11().focusedWindow() : 0;
  }

  focusWindow(win) {
    if (this.session !== 'x11' || !win) return false;
    this._loadX11().focus(win);
    return true;
  }

  windowTitle() {
    return '';
  }

  sendCombo(name) {
    const key = LinuxKeys.COMBOS[name];
    if (!key) throw new Error(`Unknown combo ${name}`);
    if (this.session === 'wayland') return this._waylandCombo(key);
    const api = this._loadX11();
    const ctrl = api.keycode('Control_L');
    const code = api.keycode(key);
    api.key(ctrl, true);
    api.key(code, true);
    api.key(code, false);
    api.key(ctrl, false);
    api.flush();
    return undefined;
  }

  _waylandCombo(key) {
    if (this._bridgeRunning()) { this._bridge.sendCombo(['Control_L', key]); return undefined; }
    const tool = this._waylandTool();
    if (!tool) throw new Error(LinuxKeys.NO_PASTE);
    const r = this._run(tool.path, tool.args(key), LinuxKeys.TOOL_TIMEOUT_MS);
    if (r && r.status !== 0) throw new Error(`${tool.bin} failed${r.stderr ? `: ${String(r.stderr).trim()}` : ''}`);
  }

  _waylandTool() {
    if (this._tool !== undefined) return this._tool;
    this._tool = null;
    for (const t of LinuxKeys.WAYLAND_TOOLS) {
      const found = this._findTool(t.bin, this._env);
      if (found) { this._tool = { ...t, path: found }; break; }
    }
    return this._tool;
  }

  static _findOnPath(bin, env) {
    for (const dir of String((env && env.PATH) || '').split(path.delimiter).filter(Boolean)) {
      const full = path.join(dir, bin);
      try { fs.accessSync(full, fs.constants.X_OK); return full; } catch (_) {}
    }
    return null;
  }

  static _run(file, args, timeout) {
    return childProcess.spawnSync(file, args, { timeout, encoding: 'utf8', windowsHide: true });
  }
}

module.exports = LinuxKeys;
