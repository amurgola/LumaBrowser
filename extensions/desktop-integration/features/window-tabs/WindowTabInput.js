class WindowTabInput {
  static TYPES = new Set(['click', 'wheel', 'text', 'keys']);
  static MAX_TEXT = 2000;
  static MAX_NOTCHES = 10;

  constructor({ getDesktop, probe, allowed = () => true }) {
    this._getDesktop = getDesktop;
    this._probe = probe;
    this._allowed = allowed;
  }

  status() {
    const reason = this._refusal();
    return { allowed: !reason, reason };
  }

  async handle(hwnd, event = {}) {
    const refusal = this._refusal();
    if (refusal) return { success: false, error: refusal, code: 'NO_CONTROL' };
    const type = String(event.type || '');
    if (!WindowTabInput.TYPES.has(type)) return { success: false, error: `Unknown input "${type}"` };
    const desktop = this._getDesktop();
    const source = 'user';
    if (type === 'text') {
      const text = String(event.text || '').slice(0, WindowTabInput.MAX_TEXT);
      if (!text) return { success: false, error: 'Nothing to type' };
      return desktop.type({ hwnd, text, mode: 'keys', source });
    }
    if (type === 'keys') {
      const keys = String(event.keys || '').trim();
      if (!keys) return { success: false, error: 'No keys' };
      return desktop.pressKey({ hwnd, keys, source });
    }
    const rect = this._rect(hwnd);
    if (!rect) return { success: false, error: 'The window is gone.', code: 'NOT_FOUND' };
    const { sx, sy } = WindowTabInput.point(rect, event.nx, event.ny);
    if (type === 'wheel') {
      const amount = Math.max(1, Math.min(WindowTabInput.MAX_NOTCHES, Math.round(Number(event.amount) || 1)));
      const direction = ['up', 'down', 'left', 'right'].includes(event.direction) ? event.direction : 'down';
      return desktop.scroll({ hwnd, sx, sy, direction, amount, source });
    }
    const button = ['left', 'right', 'middle'].includes(event.button) ? event.button : 'left';
    return desktop.click({ hwnd, sx, sy, button, double: event.double === true, source });
  }

  static point(rect, nx, ny) {
    const fx = Math.max(0, Math.min(1, Number(nx) || 0));
    const fy = Math.max(0, Math.min(1, Number(ny) || 0));
    return {
      sx: Math.min(rect.x + rect.width - 1, rect.x + fx * rect.width),
      sy: Math.min(rect.y + rect.height - 1, rect.y + fy * rect.height),
    };
  }

  _refusal() {
    if (!this._allowed()) return 'Passing input to the window is off (Window tabs setting).';
    const desktop = this._getDesktop();
    if (!desktop) return 'Desktop control is not available.';
    try {
      const gate = typeof desktop.gate === 'function' ? desktop.gate() : null;
      if (gate) return gate;
    } catch (err) {
      return (err && err.message) || String(err);
    }
    return null;
  }

  _rect(hwnd) {
    try {
      const r = this._probe.rect(hwnd);
      return r && r.width > 0 && r.height > 0 ? r : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = WindowTabInput;
