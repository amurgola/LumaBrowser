export default class PointerDrag {
  static CLICK_SLOP_PX = 4;

  constructor(handle, handlers, win) {
    this._handle = handle;
    this._handlers = handlers;
    this._win = win;
    this._body = handle.ownerDocument.body;
    this._last = null;
    this._moved = 0;
    this._dragging = false;
    this._acc = { dx: 0, dy: 0 };
    this._raf = 0;
  }

  attach() {
    this._handle.addEventListener('pointerdown', (e) => this._down(e));
    this._handle.addEventListener('pointermove', (e) => this._move(e));
    this._handle.addEventListener('pointerup', (e) => this._end(e));
    this._handle.addEventListener('pointercancel', (e) => this._end(e));
    return this;
  }

  _down(e) {
    if (e.button !== 0) return;
    const btn = e.target.closest && e.target.closest('button');
    if (btn && btn !== this._handle) return;
    this._last = { x: e.screenX, y: e.screenY };
    this._moved = 0;
    this._dragging = false;
    this._handle.setPointerCapture(e.pointerId);
  }

  _move(e) {
    if (!this._last) return;
    const dx = e.screenX - this._last.x;
    const dy = e.screenY - this._last.y;
    this._last = { x: e.screenX, y: e.screenY };
    this._moved += Math.abs(dx) + Math.abs(dy);
    if (!this._dragging && this._moved > PointerDrag.CLICK_SLOP_PX) {
      this._dragging = true;
      this._body.classList.add('dragging');
    }
    if (!this._dragging) return;
    this._acc.dx += dx;
    this._acc.dy += dy;
    if (!this._raf) this._raf = this._win.requestAnimationFrame(() => this._flush());
  }

  _end(e) {
    if (!this._last) return;
    this._last = null;
    try { this._handle.releasePointerCapture(e.pointerId); } catch (_) {}
    if (this._dragging) this._finishDrag();
    else if (this._handlers.onClick) this._handlers.onClick();
    this._dragging = false;
  }

  _finishDrag() {
    if (this._raf) {
      this._win.cancelAnimationFrame(this._raf);
      this._flush();
    }
    this._handlers.onDragEnd();
    this._body.classList.remove('dragging');
  }

  _flush() {
    this._raf = 0;
    if (!this._acc.dx && !this._acc.dy) return;
    this._handlers.onDrag(this._acc.dx, this._acc.dy);
    this._acc = { dx: 0, dy: 0 };
  }
}
