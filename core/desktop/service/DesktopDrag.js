const DesktopError = require('../DesktopError');
const SavedCursor = require('./SavedCursor');

class DesktopDrag {
  static DEFAULT_STEPS = 15;
  static DEFAULT_DURATION_MS = 300;
  static PRESS_SETTLE_MS = 40;
  static HOLD_BEFORE_MOVE_MS = 80;
  static DROP_SETTLE_MS = 60;
  static RESTORE_SETTLE_MS = 30;

  constructor(parts) {
    this._parts = parts;
  }

  async drag(w, args) {
    const refusal = this._parts.guards.targetRefusal(w);
    if (refusal) return DesktopError.toResult(refusal);
    const run = { api: null, cursor: null, held: false, up: 0 };
    try {
      return await this._drag(w, args, run);
    } catch (e) {
      return DesktopError.toResult(e);
    } finally {
      await this._cleanUp(run);
    }
  }

  async _drag(w, args, run) {
    const from = await this._parts.locator.pointOf(w, args.from, 'from');
    const to = await this._parts.locator.pointOf(w, args.to, 'to');
    const { down, up } = this._parts.input.buttonFlags(args.button || 'left');
    run.up = up;
    const { steps, duration } = DesktopDrag._timing(args);
    this._parts.guards.preInput(w);
    if (!(await this._parts.bringToFront(w))) return { success: false, error: `Could not bring "${w.title}" to the front to drag.` };
    await this._press(w, run, from, down);
    await this._glide(w, run, from, to, steps, duration);
    await this._parts.sleep(DesktopDrag.DROP_SETTLE_MS);
    this._parts.input.send(w, [this._parts.win.mouseInput(up)]);
    run.held = false;
    return { success: true, data: { method: 'drag', from: DesktopDrag._rounded(from), to: DesktopDrag._rounded(to), steps, ms: duration } };
  }

  async _press(w, run, from, down) {
    run.api = this._parts.win.load();
    run.cursor = new SavedCursor(run.api);
    run.api.SetCursorPos(Math.round(from.sx), Math.round(from.sy));
    await this._parts.sleep(DesktopDrag.PRESS_SETTLE_MS);
    this._parts.input.send(w, [this._parts.win.mouseInput(down)]);
    run.held = true;
    await this._parts.sleep(DesktopDrag.HOLD_BEFORE_MOVE_MS);
  }

  async _glide(w, run, from, to, steps, duration) {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      this._parts.guards.checkForeground(w);
      run.api.SetCursorPos(Math.round(from.sx + (to.sx - from.sx) * t), Math.round(from.sy + (to.sy - from.sy) * t));
      await this._parts.sleep(duration / steps);
    }
  }

  async _cleanUp(run) {
    if (run.held) this._parts.input.release([this._parts.win.mouseInput(run.up)]);
    if (run.api && run.cursor.saved) {
      await this._parts.sleep(DesktopDrag.RESTORE_SETTLE_MS);
      run.cursor.restore();
    }
  }

  static _timing(args) {
    return {
      steps: Math.max(2, Math.min(60, Math.round(Number(args.steps) || DesktopDrag.DEFAULT_STEPS))),
      duration: Math.max(50, Math.min(3000, Math.round(Number(args.durationMs) || DesktopDrag.DEFAULT_DURATION_MS))),
    };
  }

  static _rounded(p) {
    return { x: Math.round(p.sx), y: Math.round(p.sy) };
  }
}

module.exports = DesktopDrag;
