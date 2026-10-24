class HintTarget {
  static SHELL_CLASSES = new Set(['Progman', 'WorkerW', 'Shell_TrayWnd', 'Shell_SecondaryTrayWnd']);

  constructor({ keys, ownPid = process.pid }) {
    this._keys = keys;
    this._ownPid = ownPid;
    this._down = false;
    this._framed = 0;
  }

  get framed() {
    return this._framed;
  }

  get supported() {
    return !!this._keys && typeof this._keys.mouseDown === 'function' && typeof this._keys.windowAtCursor === 'function';
  }

  begin() {
    this._framed = 0;
    this._down = this._isDown();
  }

  end() {
    this._framed = 0;
    this._down = false;
  }

  poll() {
    if (!this.supported) return null;
    const down = this._isDown();
    const pressed = down && !this._down;
    this._down = down;
    if (!pressed) return null;
    let hit = null;
    try { hit = this._keys.windowAtCursor(); } catch (_) { hit = null; }
    if (!hit || !hit.hwnd || hit.pid === this._ownPid) return null;
    const next = HintTarget.SHELL_CLASSES.has(hit.className) ? 0 : hit.hwnd;
    if (next === this._framed) return null;
    this._framed = next;
    return next;
  }

  _isDown() {
    try { return !!this._keys.mouseDown(); } catch (_) { return false; }
  }
}

module.exports = HintTarget;
