const DesktopError = require('../DesktopError');
const HitCover = require('./HitCover');
const SavedCursor = require('./SavedCursor');

class PointerClicker {
  static SETTLE_MS = 30;
  static PRESS_MS = 25;
  static DOUBLE_GAP_MS = 60;

  constructor({ win, guards, input, bringToFront, uia, sleep }) {
    this._win = win;
    this._guards = guards;
    this._input = input;
    this._bringToFront = bringToFront;
    this._uia = uia;
    this._sleep = sleep;
  }

  async click(w, sx, sy, { button = 'left', double = false, ref = null, refRect = null } = {}) {
    this._guards.preInput(w);
    if (!(await this._bringToFront(w))) throw new Error(`Could not bring "${w.title}" to the front to click it.`);
    const hit = await this._hitTest(sx, sy, ref);
    if (ref != null) PointerClicker._refuseCovered(hit, w, ref, refRect);
    await this._clickAt(w, sx, sy, button, double);
    return hit ? { name: hit.name, role: hit.role, rect: hit.rect } : null;
  }

  async _hitTest(sx, sy, ref) {
    const uia = this._uia();
    if (typeof uia.hit !== 'function') return null;
    try {
      return await uia.hit(Math.round(sx), Math.round(sy), ref == null ? undefined : ref);
    } catch (_) {
      return null;
    }
  }

  async _clickAt(w, sx, sy, button, double) {
    const api = this._win.load();
    const cursor = new SavedCursor(api);
    const { down, up } = this._input.buttonFlags(button);
    let held = false;
    try {
      api.SetCursorPos(Math.round(sx), Math.round(sy));
      await this._sleep(PointerClicker.SETTLE_MS);
      for (let i = 0; i < (double ? 2 : 1); i++) {
        this._input.send(w, [this._win.mouseInput(down)]);
        held = true;
        await this._sleep(PointerClicker.PRESS_MS);
        this._input.send(w, [this._win.mouseInput(up)]);
        held = false;
        if (double) await this._sleep(PointerClicker.DOUBLE_GAP_MS);
      }
    } finally {
      if (held) this._input.release([this._win.mouseInput(up)]);
      await this._sleep(PointerClicker.SETTLE_MS);
      cursor.restore();
    }
  }

  static _refuseCovered(hit, w, ref, refRect) {
    const cover = HitCover.coverOf(hit, w, refRect);
    if (cover) throw new DesktopError(HitCover.message(ref, cover, w), DesktopError.COVERED);
  }
}

module.exports = PointerClicker;
