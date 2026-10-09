const AnsiEscape = require('./AnsiEscape');

class CellWidth {
  static TAB = 3;
  static ASCII_PRINTABLE = /^[\x20-\x7e]*$/;

  static WIDE_RANGES = [
    [0x1100, 0x115f], [0x2e80, 0x303e], [0x3041, 0x33ff], [0x3400, 0x4dbf], [0x4e00, 0x9fff],
    [0xa000, 0xa4cf], [0xac00, 0xd7a3], [0xf900, 0xfaff], [0xfe30, 0xfe4f], [0xff00, 0xff60],
    [0xffe0, 0xffe6], [0x1f300, 0x1f64f], [0x1f900, 0x1f9ff], [0x1f680, 0x1f6ff], [0x20000, 0x3fffd],
  ];

  static ZERO_RANGES = [
    [0x0300, 0x036f], [0x200b, 0x200f], [0xfe00, 0xfe0f], [0xfeff, 0xfeff], [0x1f3fb, 0x1f3ff], [0xe0100, 0xe01ef],
  ];

  static isWide(cp) {
    return CellWidth._inRanges(cp, CellWidth.WIDE_RANGES);
  }

  static charWidth(cp) {
    if (cp === 0x09) return CellWidth.TAB;
    if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0)) return 0;
    if (CellWidth._inRanges(cp, CellWidth.ZERO_RANGES)) return 0;
    return CellWidth.isWide(cp) ? 2 : 1;
  }

  static visible(str) {
    if (!str) return 0;
    if (CellWidth.ASCII_PRINTABLE.test(str)) return str.length;
    let w = 0;
    let i = 0;
    while (i < str.length) {
      const e = AnsiEscape.at(str, i);
      if (e) { i += e.length; continue; }
      const cp = str.codePointAt(i);
      w += CellWidth.charWidth(cp);
      i += cp > 0xffff ? 2 : 1;
    }
    return w;
  }

  static expandTabs(str) {
    return str && str.indexOf('\t') !== -1 ? str.replace(/\t/g, ' '.repeat(CellWidth.TAB)) : (str || '');
  }

  static _inRanges(cp, ranges) {
    for (const [lo, hi] of ranges) if (cp >= lo && cp <= hi) return true;
    return false;
  }
}

module.exports = CellWidth;
