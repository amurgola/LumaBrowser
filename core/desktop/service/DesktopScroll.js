const DesktopError = require('../DesktopError');

class DesktopScroll {
  static WHEEL_DELTA = 120;
  static DEFAULT_NOTCHES = 3;
  static MAX_NOTCHES = 30;
  static SETTLE_MS = 30;
  static NOTCH_GAP_MS = 20;

  constructor(parts) {
    this._parts = parts;
  }

  async scroll(w, args) {
    try {
      this._parts.guards.preInput(w);
      const { sx, sy } = this._point(w, args);
      if (!(await this._parts.bringToFront(w))) return { success: false, error: `Could not bring "${w.title}" to the front.` };
      this._parts.win.load().SetCursorPos(Math.round(sx), Math.round(sy));
      await this._parts.sleep(DesktopScroll.SETTLE_MS);
      return await this._wheel(w, args);
    } catch (e) {
      return DesktopError.toResult(e);
    }
  }

  _point(w, args) {
    const mapped = args.x != null && args.y != null ? this._parts.frames.toScreenLoose(w, args.x, args.y) : null;
    return mapped || { sx: w.rect.x + w.rect.width / 2, sy: w.rect.y + w.rect.height / 2 };
  }

  async _wheel(w, args) {
    const notches = Math.max(1, Math.min(DesktopScroll.MAX_NOTCHES, Math.round(Number(args.amount) || DesktopScroll.DEFAULT_NOTCHES)));
    const direction = String(args.direction || 'down');
    const input = this._parts.win.mouseInput(DesktopScroll._flag(this._parts.win, direction), DesktopScroll._sign(direction) * DesktopScroll.WHEEL_DELTA);
    for (let i = 0; i < notches; i++) {
      this._parts.input.send(w, [input]);
      await this._parts.sleep(DesktopScroll.NOTCH_GAP_MS);
    }
    return { success: true, data: { direction, notches } };
  }

  static _flag(win, direction) {
    return direction === 'left' || direction === 'right' ? win.MOUSEEVENTF.HWHEEL : win.MOUSEEVENTF.WHEEL;
  }

  static _sign(direction) {
    return direction === 'up' || direction === 'right' ? 1 : -1;
  }
}

module.exports = DesktopScroll;
