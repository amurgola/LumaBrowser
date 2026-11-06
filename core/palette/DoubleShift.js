class DoubleShift {
  static WINDOW_MS = 400;
  static MAX_HOLD_MS = 350;
  static enabled = true;

  constructor({ now = () => Date.now() } = {}) {
    this._now = now;
    this._state = new Map();
  }

  feed(source, input) {
    if (!DoubleShift.enabled || !input) return false;
    const s = this._stateOf(source);
    if (input.key !== 'Shift') { DoubleShift._reset(s); return false; }
    if (input.control || input.alt || input.meta) { DoubleShift._reset(s); return false; }
    if (input.type === 'keyDown') return this._down(s, input);
    if (input.type === 'keyUp') this._up(s);
    return false;
  }

  forget(source) {
    this._state.delete(source);
  }

  _down(s, input) {
    if (input.isAutoRepeat) { s.downAt = null; s.lastTapAt = null; return false; }
    const t = this._now();
    if (s.lastTapAt != null && t - s.lastTapAt <= DoubleShift.WINDOW_MS) {
      DoubleShift._reset(s);
      return true;
    }
    s.downAt = t;
    return false;
  }

  _up(s) {
    const t = this._now();
    const clean = s.downAt != null && t - s.downAt <= DoubleShift.MAX_HOLD_MS;
    s.lastTapAt = clean ? t : null;
    s.downAt = null;
  }

  _stateOf(source) {
    let s = this._state.get(source);
    if (!s) {
      s = { downAt: null, lastTapAt: null };
      this._state.set(source, s);
    }
    return s;
  }

  static _reset(s) {
    s.downAt = null;
    s.lastTapAt = null;
  }
}

DoubleShift.shared = new DoubleShift();

module.exports = DoubleShift;
