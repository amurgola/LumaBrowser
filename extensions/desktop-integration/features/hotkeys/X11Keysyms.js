class X11Keysyms {
  static NAMED = Object.freeze({
    Space: 0x20, Tab: 0xff09, Backspace: 0xff08, Return: 0xff0d, Enter: 0xff0d, Escape: 0xff1b, Esc: 0xff1b,
    Delete: 0xffff, Insert: 0xff63, Home: 0xff50, End: 0xff57, PageUp: 0xff55, PageDown: 0xff56,
    Left: 0xff51, Up: 0xff52, Right: 0xff53, Down: 0xff54, PrintScreen: 0xff61, Print: 0xff61,
    Plus: 0x2b, '+': 0x2b, Minus: 0x2d, '-': 0x2d, '=': 0x3d, ',': 0x2c, '.': 0x2e, '/': 0x2f, ';': 0x3b,
    "'": 0x27, '[': 0x5b, ']': 0x5d, '\\': 0x5c, '`': 0x60,
  });
  static F_KEYS = 24;

  static keysym(name) {
    const key = String(name || '');
    if (!key) return null;
    if (/^[A-Za-z]$/.test(key)) return key.toLowerCase().charCodeAt(0);
    if (/^[0-9]$/.test(key)) return key.charCodeAt(0);
    const fn = /^F([1-9]|1[0-9]|2[0-4])$/.exec(key);
    if (fn) return 0xffbd + Number(fn[1]);
    return Object.prototype.hasOwnProperty.call(X11Keysyms.NAMED, key) ? X11Keysyms.NAMED[key] : null;
  }
}

module.exports = X11Keysyms;
