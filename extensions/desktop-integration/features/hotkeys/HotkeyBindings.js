class HotkeyBindings {
  static MODIFIERS = {
    ctrl: 'Ctrl', control: 'Ctrl', alt: 'Alt', option: 'Alt', shift: 'Shift',
    win: 'Super', super: 'Super', meta: 'Super', cmd: 'Command', command: 'Command',
    cmdorctrl: 'CommandOrControl', commandorcontrol: 'CommandOrControl', altgr: 'AltGr',
  };

  static KEYS = {
    space: 'Space', tab: 'Tab', enter: 'Enter', return: 'Enter', backspace: 'Backspace', delete: 'Delete', del: 'Delete',
    insert: 'Insert', ins: 'Insert', home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown',
    up: 'Up', down: 'Down', left: 'Left', right: 'Right', arrowup: 'Up', arrowdown: 'Down', arrowleft: 'Left', arrowright: 'Right',
    esc: 'Escape', escape: 'Escape', printscreen: 'PrintScreen', prtsc: 'PrintScreen', plus: 'Plus',
  };

  static MODIFIER_ORDER = ['CommandOrControl', 'Command', 'Ctrl', 'Super', 'Alt', 'AltGr', 'Shift'];

  constructor({ globalShortcut, onFire, log = null }) {
    this._gs = globalShortcut;
    this._onFire = onFire;
    this._log = log;
    this._registered = new Map();
    this._status = {};
  }

  apply(bindings) {
    this.unregisterAll();
    const status = {};
    const taken = new Map();
    for (const [action, raw] of Object.entries(bindings || {})) {
      status[action] = this._register(action, raw, taken);
    }
    this._status = status;
    return this.status();
  }

  status() {
    const out = {};
    for (const [k, v] of Object.entries(this._status)) out[k] = { ...v };
    return out;
  }

  unregisterAll() {
    if (this._gs) {
      for (const accelerator of this._registered.keys()) {
        try { this._gs.unregister(accelerator); } catch (_) {}
      }
    }
    this._registered.clear();
    this._status = {};
  }

  dispose() {
    this.unregisterAll();
  }

  _register(action, raw, taken) {
    let accelerator;
    try {
      accelerator = HotkeyBindings.normalize(raw);
    } catch (err) {
      return { accelerator: String(raw || ''), registered: false, error: err.message };
    }
    if (!accelerator) return { accelerator: '', registered: false, error: null };
    if (!this._gs) return { accelerator, registered: false, error: 'Global shortcuts are not available' };
    const key = accelerator.toLowerCase();
    if (taken.has(key)) return { accelerator, registered: false, error: `Also bound to "${taken.get(key)}"` };
    taken.set(key, action);
    let ok = false;
    try {
      ok = this._gs.register(accelerator, () => this._fire(action));
    } catch (err) {
      return { accelerator, registered: false, error: `Invalid shortcut: ${(err && err.message) || err}` };
    }
    if (!ok) return { accelerator, registered: false, error: 'Already in use by another program' };
    this._registered.set(accelerator, action);
    return { accelerator, registered: true, error: null };
  }

  _fire(action) {
    try {
      return this._onFire(action);
    } catch (err) {
      if (this._log) this._log.warn(`shortcut for ${action} failed: ${(err && err.message) || err}`);
      return undefined;
    }
  }

  static normalize(raw) {
    const text = String(raw == null ? '' : raw).trim();
    if (!text) return '';
    const parts = text.split('+').map((s) => s.trim());
    if (text.endsWith('++')) parts.splice(parts.length - 2, 2, 'Plus');
    const mods = new Set();
    const keys = [];
    for (const part of parts) {
      if (!part) continue;
      const lower = part.toLowerCase();
      if (HotkeyBindings.MODIFIERS[lower]) mods.add(HotkeyBindings.MODIFIERS[lower]);
      else keys.push(HotkeyBindings._key(part));
    }
    if (keys.length !== 1) throw new Error(keys.length ? `Only one key besides modifiers: "${text}"` : `No key besides modifiers: "${text}"`);
    const ordered = HotkeyBindings.MODIFIER_ORDER.filter((m) => mods.has(m));
    return [...ordered, keys[0]].join('+');
  }

  static _key(part) {
    const lower = part.toLowerCase();
    if (HotkeyBindings.KEYS[lower]) return HotkeyBindings.KEYS[lower];
    if (/^f([1-9]|1[0-9]|2[0-4])$/.test(lower)) return lower.toUpperCase();
    if (part.length === 1) return part.toUpperCase();
    return part.charAt(0).toUpperCase() + part.slice(1);
  }
}

module.exports = HotkeyBindings;
