class TypingMode {
  static MODES = ['auto', 'keys', 'paste'];
  static PASTE_MIN_CHARS = 200;
  static IME_HOSTILE_RANGES = [
    [0x1100, 0x11ff], [0x2e80, 0x9fff], [0xa960, 0xa97f], [0xac00, 0xd7af],
    [0xf900, 0xfaff], [0xff00, 0xffef], [0x20000, 0x3ffff],
  ];

  static IME_HOSTILE = TypingMode._rangesPattern(TypingMode.IME_HOSTILE_RANGES);

  static isValid(mode) {
    return TypingMode.MODES.includes(mode);
  }

  static shouldPaste(text) {
    return text.length > TypingMode.PASTE_MIN_CHARS || TypingMode.IME_HOSTILE.test(text);
  }

  static _rangesPattern(ranges) {
    const escape = (cp) => `\\u{${cp.toString(16)}}`;
    const body = ranges.map(([from, to]) => `${escape(from)}-${escape(to)}`).join('');
    return new RegExp(`[${body}]`, 'u');
  }
}

module.exports = TypingMode;
