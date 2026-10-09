const AnsiFit = require('../ansi/AnsiFit');
const CellWidth = require('../ansi/CellWidth');

class StatusLine {
  static INDENT = '  ';

  static render({ spinner, text, secs, hint }, width, t) {
    const g = t.glyph;
    const bits = [text];
    if (secs != null && secs >= 1) bits.push(`${Math.floor(secs)}s`);
    const left = `${StatusLine.INDENT}${t.fg('accent', spinner)} ${t.fg('dim', bits.join(` ${g.dot} `))}`;
    return StatusLine.joinEnds(left, hint ? t.fg('muted', hint) : '', width);
  }

  static joinEnds(left, right, width) {
    const lw = CellWidth.visible(left);
    const rw = CellWidth.visible(right);
    if (!rw || rw + 8 > width) return AnsiFit.truncate(left, width);
    if (lw + 2 + rw > width) {
      const l = AnsiFit.truncate(left, width - rw - 2);
      return `${l}${' '.repeat(width - CellWidth.visible(l) - rw)}${right}`;
    }
    return `${left}${' '.repeat(width - lw - rw)}${right}`;
  }
}

module.exports = StatusLine;
