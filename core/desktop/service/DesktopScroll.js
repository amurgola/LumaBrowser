const DesktopError = require('../DesktopError');

class DesktopScroll {
  static WHEEL_DELTA = 120;
  static DEFAULT_NOTCHES = 3;
  static MAX_NOTCHES = 10;
  static SETTLE_MS = 30;
  static NOTCH_GAP_MS = 20;

  constructor(parts) {
    this._parts = parts;
  }

  async scroll(target, args) {
    const refusal = this._parts.guards.targetRefusal(target);
    if (refusal) return DesktopError.toResult(refusal);
    try {
      const at = await this._point(target, args);
      if (at.result) return at.result;
      const { sx, sy } = at;
      const w = target.desktop ? { ...target, point: { sx, sy } } : target;
      this._parts.guards.preInput(w);
      if (!(await this._parts.bringToFront(w))) return { success: false, error: `Could not bring "${w.title}" to the front.` };
      this._parts.win.load().SetCursorPos(Math.round(sx), Math.round(sy));
      await this._parts.sleep(DesktopScroll.SETTLE_MS);
      const done = await this._wheel(w, args);
      return at.vision ? { ...done, data: { ...done.data, method: 'vision', screen: { x: Math.round(sx), y: Math.round(sy) } } } : done;
    } catch (e) {
      return DesktopError.toResult(e);
    }
  }

  async _point(w, args) {
    if (args.description && args.x == null) {
      const found = await this._parts.vision.locate(w, args.description, { zoom: args.zoom === true });
      return found.result ? { result: found.result } : { ...found.point, vision: true };
    }
    const mapped = args.x != null && args.y != null ? this._parts.frames.toScreenLoose(w, args.x, args.y) : null;
    return mapped || { sx: w.rect.x + w.rect.width / 2, sy: w.rect.y + w.rect.height / 2 };
  }

  async _wheel(w, args) {
    const asked = Math.round(Number(args.amount) || DesktopScroll.DEFAULT_NOTCHES);
    const notches = Math.max(1, Math.min(DesktopScroll.MAX_NOTCHES, asked));
    const direction = String(args.direction || 'down');
    const input = this._parts.win.mouseInput(DesktopScroll._flag(this._parts.win, direction), DesktopScroll._sign(direction) * DesktopScroll.WHEEL_DELTA);
    for (let i = 0; i < notches; i++) {
      this._parts.input.send(w, [input]);
      await this._parts.sleep(DesktopScroll.NOTCH_GAP_MS);
    }
    const capped = asked > notches ? { capped: `At most ${DesktopScroll.MAX_NOTCHES} notches per call: look, then scroll again.` } : {};
    return { success: true, data: { direction, notches, ...capped } };
  }

  static _flag(win, direction) {
    return direction === 'left' || direction === 'right' ? win.MOUSEEVENTF.HWHEEL : win.MOUSEEVENTF.WHEEL;
  }

  static _sign(direction) {
    return direction === 'up' || direction === 'right' ? 1 : -1;
  }
}

module.exports = DesktopScroll;
