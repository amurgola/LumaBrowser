const path = require('path');

class WindowProbe {
  static GA_ROOTOWNER = 3;

  constructor({ win32 = null, screen = null } = {}) {
    this._win32 = win32;
    this._screen = screen;
  }

  get supported() {
    return !!this._parts();
  }

  foreground() {
    return this._try(() => Number(this._parts().api.load().GetForegroundWindow()) || 0, 0);
  }

  alive(hwnd) {
    return this._try(() => !!this._parts().api.load().IsWindow(hwnd), false);
  }

  visible(hwnd) {
    return this._try(() => !!this._parts().api.load().IsWindowVisible(hwnd), true);
  }

  minimized(hwnd) {
    return this._try(() => !!this._parts().api.load().IsIconic(hwnd), false);
  }

  cloaked(hwnd) {
    return this._try(() => !!this._parts().windows.isCloaked(hwnd), false);
  }

  rootOwner(hwnd) {
    return this._try(() => Number(this._parts().api.load().GetAncestor(hwnd, WindowProbe.GA_ROOTOWNER)) || hwnd, hwnd);
  }

  rect(hwnd) {
    return this._try(() => this._parts().windows.windowRect(hwnd), null);
  }

  frame(hwnd) {
    const r = this.rect(hwnd);
    if (!r || r.width <= 0 || r.height <= 0) return null;
    return this._try(() => this._screen.screenToDipRect(null, r), r);
  }

  workArea(frame) {
    return this._try(() => this._screen.getDisplayMatching(frame).workArea, frame);
  }

  title(hwnd) {
    return this._try(() => this._parts().windows.windowText(hwnd) || '', '');
  }

  app(hwnd) {
    const w = this._parts();
    const pid = this._try(() => w.windows.processIdOf(hwnd).pid, 0);
    const image = this._try(() => w.processes.imagePath(pid), '') || '';
    const exe = image ? path.basename(String(image).replace(/\\/g, '/')) : '';
    const className = this._try(() => w.windows.className(hwnd), '');
    return { pid, exe, name: WindowProbe.displayName(exe) || className || 'this app', className };
  }

  static displayName(exe) {
    const base = String(exe || '').replace(/\.exe$/i, '');
    return base ? base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() : '';
  }

  _parts() {
    if (this._win32) return this._win32;
    if (process.platform !== 'win32') return null;
    this._win32 = {
      api: require('../../../../core/desktop/win32/Win32Api'),
      windows: require('../../../../core/desktop/win32/Win32Windows'),
      processes: require('../../../../core/desktop/win32/Win32Process'),
    };
    return this._win32;
  }

  _try(fn, fallback) {
    try { return fn(); } catch (_) { return fallback; }
  }
}

module.exports = WindowProbe;
