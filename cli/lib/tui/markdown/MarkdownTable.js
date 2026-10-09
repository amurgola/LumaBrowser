const CellWidth = require('../ansi/CellWidth');
const AnsiFit = require('../ansi/AnsiFit');
const MarkdownInline = require('./MarkdownInline');

class MarkdownTable {
  static SEPARATOR_CELLS = 3;
  static MIN_COLUMN = 6;

  static render(rows, width, t) {
    const cells = rows.map((r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => MarkdownInline.render(c.trim(), t)));
    const widths = MarkdownTable._fitWidths(MarkdownTable._naturalWidths(cells), width);
    const out = [];
    cells.forEach((r, ri) => {
      const line = widths.map((w, i) => AnsiFit.pad(AnsiFit.truncate(r[i] || '', w), w)).join(t.fg('border', ' │ '));
      out.push(ri === 0 ? t.bold(line) : line);
      if (ri === 0) out.push(t.fg('border', widths.map((w) => '─'.repeat(w)).join('─┼─')));
    });
    return out;
  }

  static _naturalWidths(cells) {
    const cols = Math.max(...cells.map((r) => r.length));
    const widths = new Array(cols).fill(0);
    for (const r of cells) r.forEach((c, i) => { widths[i] = Math.max(widths[i], CellWidth.visible(c)); });
    return widths;
  }

  static _fitWidths(widths, width) {
    const total = () => widths.reduce((a, b) => a + b, 0) + MarkdownTable.SEPARATOR_CELLS * (widths.length - 1);
    while (total() > width && Math.max(...widths) > MarkdownTable.MIN_COLUMN) {
      widths[widths.indexOf(Math.max(...widths))] -= 1;
    }
    return widths;
  }
}

module.exports = MarkdownTable;
