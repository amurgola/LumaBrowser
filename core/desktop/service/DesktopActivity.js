class DesktopActivity {
  static ARG_KEYS = ['hwnd', 'window', 'ref', 'x', 'y', 'description', 'button', 'double', 'text', 'submit', 'keys', 'direction', 'amount', 'app', 'args', 'value'];

  constructor() {
    this._listeners = new Set();
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  get listening() {
    return this._listeners.size > 0;
  }

  static describe(action, w, args = {}) {
    const out = {};
    for (const key of DesktopActivity.ARG_KEYS) if (args[key] !== undefined) out[key] = args[key];
    return { action, hwnd: w ? w.hwnd : null, title: w ? w.title : null, args: out };
  }

  start(info) {
    this._emit({ phase: 'start', ...info });
  }

  end(info, r) {
    const ok = !!(r && r.success);
    this._emit({ phase: 'end', ...info, success: ok, code: (!ok && r && r.code) || null, error: (!ok && r && r.error) || null });
  }

  _emit(event) {
    for (const fn of this._listeners) {
      try { fn(event); } catch (_) {}
    }
  }
}

module.exports = DesktopActivity;
