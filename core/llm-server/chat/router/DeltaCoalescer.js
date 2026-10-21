class DeltaCoalescer {
  static FLUSH_MS = 16;

  constructor(emit, { flushMs = DeltaCoalescer.FLUSH_MS, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
    this._emit = emit;
    this._flushMs = flushMs;
    this._setTimer = setTimer;
    this._clearTimer = clearTimer;
    this._pending = new Map();
    this._timer = null;
  }

  add(type, text) {
    if (!text) return;
    this._pending.set(type, (this._pending.get(type) || '') + text);
    if (this._timer) return;
    this._timer = this._setTimer(() => { this._timer = null; this.flush(); }, this._flushMs);
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
  }

  flush() {
    if (this._timer) { this._clearTimer(this._timer); this._timer = null; }
    if (!this._pending.size) return;
    const runs = [...this._pending];
    this._pending.clear();
    for (const [type, text] of runs) this._emit(type, text);
  }

  get pendingChars() {
    let n = 0;
    for (const text of this._pending.values()) n += text.length;
    return n;
  }
}

module.exports = DeltaCoalescer;
