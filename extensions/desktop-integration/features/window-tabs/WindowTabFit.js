class WindowTabFit {
  static MIN_STAGE = 120;
  static SAME_PX = 2;

  constructor({ win, probe }) {
    this._win = win || null;
    this._probe = probe;
    this._held = new Map();
  }

  sync(hwnd, stage) {
    if (!stage) return this.release(hwnd);
    const target = this._targetFor(hwnd, stage);
    if (!target) return false;
    const held = this._held.get(hwnd);
    if (held && WindowTabFit._near(held.target, target)) return false;
    return this._resize(hwnd, held, target);
  }

  release(hwnd) {
    const held = this._held.get(hwnd);
    if (!held) return false;
    this._held.delete(hwnd);
    if (!this._probe.alive(hwnd)) return false;
    try { return !!this._win.restorePlacement(hwnd, held.placement); } catch (_) { return false; }
  }

  releaseAll() {
    for (const hwnd of [...this._held.keys()]) this.release(hwnd);
  }

  _resize(hwnd, held, target) {
    try {
      const placement = held ? held.placement : this._win.placement(hwnd);
      if (!placement) return false;
      this._held.set(hwnd, { placement, target });
      return !!this._win.resizeFrame(hwnd, target.width, target.height);
    } catch (_) {
      return false;
    }
  }

  _targetFor(hwnd, stage) {
    if (!this._win || !this._probe.alive(hwnd) || this._probe.minimized(hwnd)) return null;
    const width = Number(stage.width);
    const height = Number(stage.height);
    if (!(width >= WindowTabFit.MIN_STAGE) || !(height >= WindowTabFit.MIN_STAGE)) return null;
    const scale = this._scaleOf(hwnd);
    return { width: Math.round(width * scale), height: Math.round(height * scale) };
  }

  static _near(a, b) {
    return Math.abs(a.width - b.width) <= WindowTabFit.SAME_PX && Math.abs(a.height - b.height) <= WindowTabFit.SAME_PX;
  }

  _scaleOf(hwnd) {
    const physical = this._probe.rect(hwnd);
    const dip = this._probe.frame(hwnd);
    if (!physical || !dip || !(physical.width > 0) || !(dip.width > 0)) return 1;
    return physical.width / dip.width;
  }
}

module.exports = WindowTabFit;
