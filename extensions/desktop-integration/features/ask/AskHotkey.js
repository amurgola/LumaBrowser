class AskHotkey {
  constructor({ globalShortcut = null, onPress, log = null }) {
    this._shortcut = globalShortcut;
    this._onPress = onPress;
    this._log = log || { info() {}, warn() {} };
    this._current = null;
  }

  set(value) {
    this.clear();
    const accelerator = AskHotkey.toAccelerator(value);
    if (!accelerator) return { ok: true, accelerator: null };
    const shortcut = this._globalShortcut();
    if (!shortcut) return { ok: false, accelerator, error: 'Global shortcuts are not available' };
    let ok = false;
    try {
      ok = shortcut.register(accelerator, () => {
        Promise.resolve().then(() => this._onPress()).catch((err) => this._log.warn(`hotkey action failed: ${err && err.message}`));
      });
    } catch (err) {
      this._log.warn(`hotkey "${accelerator}" is not valid: ${err && err.message}`);
      return { ok: false, accelerator, error: 'Not a valid shortcut' };
    }
    if (!ok) {
      this._log.warn(`hotkey "${accelerator}" is taken by another app`);
      return { ok: false, accelerator, error: 'Another app already uses this shortcut' };
    }
    this._current = accelerator;
    return { ok: true, accelerator };
  }

  clear() {
    if (!this._current) return;
    const shortcut = this._globalShortcut();
    try { if (shortcut) shortcut.unregister(this._current); } catch (_) {}
    this._current = null;
  }

  get current() {
    return this._current;
  }

  static toAccelerator(value) {
    if (typeof value !== 'string') return null;
    const parts = value.split('+').map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return null;
    const names = { ctrl: 'Ctrl', control: 'Ctrl', alt: 'Alt', shift: 'Shift', win: 'Super', windows: 'Super', super: 'Super', meta: 'Super', cmd: 'Super' };
    return parts.map((p) => names[p.toLowerCase()] || (p.length === 1 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1))).join('+');
  }

  _globalShortcut() {
    if (this._shortcut) return this._shortcut;
    try {
      return require('electron').globalShortcut || null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = AskHotkey;
