class SmokeActions {
  static MAX_ACTIONS = 24;
  static MAX_AT_MS = 30000;
  static MAX_TEXT = 120;
  static KEY_CODES = {
    space: [' ', 'Space', 32], enter: ['Enter', 'Enter', 13], escape: ['Escape', 'Escape', 27], esc: ['Escape', 'Escape', 27],
    backspace: ['Backspace', 'Backspace', 8], tab: ['Tab', 'Tab', 9], shift: ['Shift', 'ShiftLeft', 16],
    up: ['ArrowUp', 'ArrowUp', 38], down: ['ArrowDown', 'ArrowDown', 40], left: ['ArrowLeft', 'ArrowLeft', 37], right: ['ArrowRight', 'ArrowRight', 39],
    arrowup: ['ArrowUp', 'ArrowUp', 38], arrowdown: ['ArrowDown', 'ArrowDown', 40], arrowleft: ['ArrowLeft', 'ArrowLeft', 37], arrowright: ['ArrowRight', 'ArrowRight', 39],
  };

  static normalize(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (const action of raw.slice(0, SmokeActions.MAX_ACTIONS)) {
      const normalized = SmokeActions._one(action);
      if (normalized) out.push(normalized);
    }
    return out.sort((p, q) => p.at - q.at);
  }

  static describe(a) {
    const at = `@${(a.at / 1000).toFixed(1)}s`;
    if (a.type === 'click') return `click (${a.x},${a.y}) ${at}`;
    if (a.type === 'key') return `key ${a.key === ' ' ? 'Space' : a.key}${a.holdMs > 200 ? ` held ${a.holdMs}ms` : ''} ${at}`;
    return `type "${a.text}" ${at}`;
  }

  static _one(a) {
    if (!a || typeof a !== 'object') return null;
    const at = Math.max(0, Math.min(SmokeActions.MAX_AT_MS, Math.round(Number(a.at) || 0)));
    const type = String(a.type || '').toLowerCase();
    if (type === 'click') return SmokeActions._click(a, at);
    if (type === 'key') return SmokeActions._key(a, at);
    if (type === 'type') return SmokeActions._type(a, at);
    return null;
  }

  static _click(a, at) {
    const x = Number(a.x);
    const y = Number(a.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { type: 'click', at, x: Math.round(x), y: Math.round(y) };
  }

  static _key(a, at) {
    const name = String(a.key || '').trim();
    const codes = SmokeActions._keyCodes(name);
    if (!codes) return null;
    const [key, code, keyCode] = codes;
    const holdMs = Math.max(60, Math.min(4000, Math.round(Number(a.holdMs) || 120)));
    return { type: 'key', at, key, code, keyCode, holdMs };
  }

  static _keyCodes(name) {
    if (!name) return null;
    const named = SmokeActions.KEY_CODES[name.toLowerCase()];
    if (named) return named;
    if (name.length !== 1) return null;
    const code = /[a-z]/i.test(name) ? `Key${name.toUpperCase()}` : (/\d/.test(name) ? `Digit${name}` : name);
    return [name, code, name.toUpperCase().charCodeAt(0)];
  }

  static _type(a, at) {
    const text = String(a.text == null ? '' : a.text).slice(0, SmokeActions.MAX_TEXT);
    return text ? { type: 'type', at, text } : null;
  }
}

module.exports = SmokeActions;
