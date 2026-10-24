const AttachPlacement = require('./AttachPlacement');

class Attachment {
  constructor({ hwnd, app, label, key, probe, windows, onGone = () => {} }) {
    this.hwnd = hwnd;
    this.app = app;
    this.label = label;
    this.key = key;
    this._probe = probe;
    this._windows = windows;
    this._onGone = onGone;
    this.open = false;
    this.busy = false;
    this.turn = null;
    this._dock = null;
    this._panel = null;
    this._frame = null;
    this._shown = { dock: false, panel: false };
    this._lastFg = null;
    this._disposed = false;
  }

  get panel() {
    return this._panel;
  }

  get dock() {
    return this._dock;
  }

  ownHandles() {
    return [this._dock, this._panel].filter((w) => w && !w.isDestroyed()).map((w) => this._windows.hwndOf(w));
  }

  owns(webContents) {
    return [this._dock, this._panel].some((w) => w && !w.isDestroyed() && w.webContents === webContents);
  }

  sync(fg) {
    if (this._disposed) return;
    if (!this._probe.alive(this.hwnd)) {
      this._onGone(this);
      return;
    }
    const hidden = this._probe.minimized(this.hwnd) || this._probe.cloaked(this.hwnd) || !this._probe.visible(this.hwnd);
    const frame = hidden ? null : this._probe.frame(this.hwnd);
    const on = !hidden && !!frame;
    let restack = fg !== this._lastFg;
    this._lastFg = fg;
    if (frame && JSON.stringify(frame) !== JSON.stringify(this._frame)) {
      this._frame = frame;
      this._place();
      restack = true;
    }
    if (this._show('dock', on)) restack = true;
    if (this._show('panel', on && this.open)) restack = true;
    if (on && restack) this._restack(fg);
  }

  openPanel({ focus = true } = {}) {
    if (this._disposed) return;
    this.open = true;
    if (!this._panel || this._panel.isDestroyed()) {
      this._panel = this._windows.panel(this);
      this._place();
    }
    this._show('panel', true);
    if (focus) { try { this._panel.focus(); } catch (_) {} } else this._restack(0);
    this._paintDock();
  }

  closePanel() {
    this.open = false;
    this._show('panel', false);
    this._paintDock();
    try { this._windows.focusApp(this.hwnd); } catch (_) {}
  }

  togglePanel() {
    if (this.open) this.closePanel();
    else this.openPanel();
  }

  ensureDock() {
    if (this._dock && !this._dock.isDestroyed()) return;
    this._dock = this._windows.dock(this);
    this._place();
  }

  setBusy(busy) {
    this.busy = !!busy;
    this._paintDock();
  }

  emit(event) {
    if (this._panel && !this._panel.isDestroyed()) this._windows.sendPanel(this._panel, event);
  }

  dispose() {
    this._disposed = true;
    if (this.turn) { try { this.turn.abort(); } catch (_) {} }
    for (const w of [this._dock, this._panel]) { if (w && !w.isDestroyed()) { try { w.destroy(); } catch (_) {} } }
    this._dock = null;
    this._panel = null;
  }

  _restack(fg) {
    for (const w of [this._panel, this._dock]) {
      if (!w || w.isDestroyed() || !w.isVisible()) continue;
      const own = this._windows.hwndOf(w);
      if (own && own === fg) continue;
      try { this._windows.placeAbove(w, this.hwnd); } catch (_) {}
    }
  }

  _place() {
    const frame = this._frame || this._probe.frame(this.hwnd);
    if (!frame) return;
    this._frame = frame;
    if (this._dock && !this._dock.isDestroyed()) this._setBounds(this._dock, AttachPlacement.dock(frame));
    if (this._panel && !this._panel.isDestroyed()) {
      const p = AttachPlacement.panel(frame, this._probe.workArea(frame));
      this._setBounds(this._panel, { x: p.x, y: p.y, width: p.width, height: p.height });
      this._windows.sendPanel(this._panel, { type: 'side', side: p.side });
    }
  }

  _show(which, on) {
    const w = which === 'dock' ? this._dock : this._panel;
    if (!w || w.isDestroyed() || this._shown[which] === on) return false;
    this._shown[which] = on;
    try {
      if (on) w.showInactive();
      else w.hide();
    } catch (_) {}
    return true;
  }

  _paintDock() {
    if (this._dock && !this._dock.isDestroyed()) this._windows.paintDock(this._dock, { open: this.open, busy: this.busy });
  }

  _setBounds(win, b) {
    try { win.setBounds(b); } catch (_) {}
  }
}

module.exports = Attachment;
