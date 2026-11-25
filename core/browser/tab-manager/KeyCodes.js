class KeyCodes {
  static PUNCTUATION = {
    ' ': 'Space', ',': 'Comma', '.': 'Period', '/': 'Slash', ';': 'Semicolon', "'": 'Quote',
    '[': 'BracketLeft', ']': 'BracketRight', '\\': 'Backslash', '-': 'Minus', '=': 'Equal', '`': 'Backquote',
  };

  static MODIFIERS = { Shift: 'ShiftLeft', Control: 'ControlLeft', Alt: 'AltLeft', Meta: 'MetaLeft' };

  static codeOf(key) {
    const name = String(key);
    if (/^[a-z]$/i.test(name)) return `Key${name.toUpperCase()}`;
    if (/^[0-9]$/.test(name)) return `Digit${name}`;
    if (KeyCodes.PUNCTUATION[name]) return KeyCodes.PUNCTUATION[name];
    if (KeyCodes.MODIFIERS[name]) return KeyCodes.MODIFIERS[name];
    return name.length === 1 ? '' : name;
  }
}

module.exports = KeyCodes;
