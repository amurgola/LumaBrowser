const CellWidth = require('../ansi/CellWidth');

class PlainWrap {
  static truncate(s, width) {
    let w = 0;
    let out = '';
    for (const ch of s) {
      const cw = CellWidth.charWidth(ch.codePointAt(0));
      if (w + cw > width) break;
      out += ch;
      w += cw;
    }
    return out;
  }

  static wrap(line, width) {
    const rows = [];
    let start = 0;
    let w = 0;
    let i = 0;
    let lastSpace = -1;
    while (i < line.length) {
      const cp = line.codePointAt(i);
      const cw = CellWidth.charWidth(cp);
      if (line[i] === ' ') lastSpace = i;
      if (w + cw > width) {
        const cut = lastSpace > start ? lastSpace + 1 : i;
        rows.push({ start, text: line.slice(start, cut) });
        start = cut;
        w = CellWidth.visible(line.slice(start, i));
        lastSpace = -1;
      }
      w += cw;
      i += cp > 0xffff ? 2 : 1;
    }
    rows.push({ start, text: line.slice(start) });
    return rows;
  }
}

module.exports = PlainWrap;
