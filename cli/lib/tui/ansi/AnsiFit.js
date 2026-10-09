const AnsiEscape = require('./AnsiEscape');
const CellWidth = require('./CellWidth');
const SgrState = require('./SgrState');

class AnsiFit {
  static truncate(str, width, ellipsis = '…') {
    if (width <= 0) return '';
    if (CellWidth.visible(str) <= width) return str;
    const budget = Math.max(0, width - CellWidth.visible(ellipsis));
    const state = new SgrState();
    let out = '';
    let w = 0;
    let i = 0;
    while (i < str.length) {
      const e = AnsiEscape.at(str, i);
      if (e) { out += e.code; state.process(e.code); i += e.length; continue; }
      const cp = str.codePointAt(i);
      const ch = String.fromCodePoint(cp);
      const cw = CellWidth.charWidth(cp);
      if (w + cw > budget) break;
      out += ch;
      w += cw;
      i += ch.length;
    }
    return out + ellipsis + state.close();
  }

  static pad(str, width) {
    const w = CellWidth.visible(str);
    return w >= width ? str : str + ' '.repeat(width - w);
  }

  static fit(str, width, ellipsis) {
    return AnsiFit.pad(AnsiFit.truncate(str, width, ellipsis), width);
  }

  static seal(str) {
    if (!str || str.indexOf(AnsiEscape.ESC) === -1) return str || '';
    const state = new SgrState();
    state.consume(str);
    return str + state.close();
  }
}

module.exports = AnsiFit;
