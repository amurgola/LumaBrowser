class ChordHint {
  static POLL_MS = 40;
  static HOLD_MS = 320;
  static VK_NAMES = { 0x10: 'Shift', 0x11: 'Ctrl', 0x12: 'Alt', 0x5b: 'Super', 0x5c: 'Super' };
  static ORDER = ['Ctrl', 'Super', 'Alt', 'Shift'];

  constructor({ held, groups, onShow, onHide, onPoll = null, now = Date.now, setInterval: si = setInterval, clearInterval: ci = clearInterval }) {
    this._held = held;
    this._groups = groups;
    this._onShow = onShow;
    this._onHide = onHide;
    this._onPoll = onPoll;
    this._now = now;
    this._si = si;
    this._ci = ci;
    this._timer = null;
    this._combo = '';
    this._since = 0;
    this._shown = false;
    this._suppressed = false;
  }

  get shown() {
    return this._shown;
  }

  get running() {
    return !!this._timer;
  }

  start() {
    if (this._timer) return;
    this._timer = this._si(() => this.tick(), ChordHint.POLL_MS);
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
  }

  stop() {
    if (this._timer) this._ci(this._timer);
    this._timer = null;
    this._hide();
    this._combo = '';
    this._suppressed = false;
  }

  suppress() {
    this._suppressed = true;
    this._hide();
  }

  tick() {
    let codes = [];
    try { codes = this._held() || []; } catch (_) { codes = []; }
    const combo = ChordHint.comboOf(codes);
    if (!combo) {
      this._suppressed = false;
      this._reset();
      return;
    }
    if (combo !== this._combo) {
      this._reset();
      this._combo = combo;
      this._since = this._now();
    }
    if (this._shown) {
      if (this._onPoll) { try { this._onPoll(); } catch (_) {} }
      return;
    }
    if (this._suppressed || this._now() - this._since < ChordHint.HOLD_MS) return;
    const entries = (this._groups() || {})[combo];
    if (!entries || !entries.length) return;
    this._shown = true;
    try { this._onShow(combo, entries); } catch (_) {}
  }

  _reset() {
    this._hide();
    this._combo = '';
    this._since = 0;
  }

  _hide() {
    if (!this._shown) return;
    this._shown = false;
    try { this._onHide(); } catch (_) {}
  }

  static comboOf(codes) {
    const names = new Set(codes.map((c) => ChordHint.VK_NAMES[c]).filter(Boolean));
    return ChordHint.ORDER.filter((n) => names.has(n)).join('+');
  }

  static split(accelerator) {
    const parts = String(accelerator || '').split('+').filter(Boolean);
    if (parts.length < 2) return null;
    const key = parts.pop();
    const mods = new Set();
    for (const p of parts) {
      const name = p === 'CommandOrControl' ? 'Ctrl' : p;
      if (!ChordHint.ORDER.includes(name)) return null;
      mods.add(name);
    }
    return { modifiers: ChordHint.ORDER.filter((n) => mods.has(n)).join('+'), key: key === 'Plus' ? '+' : key };
  }
}

module.exports = ChordHint;
