class KeySequences {
  static ESC = '\x1b';

  static NAMED = Object.freeze({
    enter: '\r', return: '\r', tab: '\t', escape: '\x1b', esc: '\x1b', space: ' ', backspace: '\x7f',
    delete: '\x1b[3~', insert: '\x1b[2~', pageup: '\x1b[5~', pagedown: '\x1b[6~',
    f1: '\x1bOP', f2: '\x1bOQ', f3: '\x1bOR', f4: '\x1bOS', f5: '\x1b[15~', f6: '\x1b[17~',
    f7: '\x1b[18~', f8: '\x1b[19~', f9: '\x1b[20~', f10: '\x1b[21~', f11: '\x1b[23~', f12: '\x1b[24~',
  });

  static CURSOR = Object.freeze({ up: 'A', down: 'B', right: 'C', left: 'D', home: 'H', end: 'F' });

  static encode(keys, { applicationCursor = false } = {}) {
    let data = '';
    for (const key of Array.isArray(keys) ? keys : []) {
      const bytes = KeySequences._one(String(key || '').trim().toLowerCase(), applicationCursor);
      if (bytes == null) return { error: `Unknown key "${key}". Use names like enter, tab, escape, up, down, left, right, home, end, pageup, pagedown, backspace, delete, f1..f12, ctrl+c, alt+x, shift+tab.` };
      data += bytes;
    }
    return { data };
  }

  static _one(key, applicationCursor) {
    if (!key) return null;
    if (key === 'shift+tab') return '\x1b[Z';
    if (key.startsWith('ctrl+')) return KeySequences._control(key.slice(5));
    if (key.startsWith('alt+')) return KeySequences._alt(key.slice(4), applicationCursor);
    return KeySequences._plain(key, applicationCursor);
  }

  static _plain(key, applicationCursor) {
    if (Object.prototype.hasOwnProperty.call(KeySequences.CURSOR, key)) return `${KeySequences.ESC}${applicationCursor ? 'O' : '['}${KeySequences.CURSOR[key]}`;
    if (Object.prototype.hasOwnProperty.call(KeySequences.NAMED, key)) return KeySequences.NAMED[key];
    return key.length === 1 ? key : null;
  }

  static _control(key) {
    if (/^[a-z]$/.test(key)) return String.fromCharCode(key.charCodeAt(0) - 96);
    const symbols = { '[': '\x1b', '\\': '\x1c', ']': '\x1d', space: '\x00', '@': '\x00' };
    return Object.prototype.hasOwnProperty.call(symbols, key) ? symbols[key] : null;
  }

  static _alt(key, applicationCursor) {
    const plain = KeySequences._plain(key, applicationCursor);
    return plain == null ? null : KeySequences.ESC + plain;
  }
}

module.exports = KeySequences;
