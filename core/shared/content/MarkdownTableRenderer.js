class MarkdownTableRenderer {
  static render(rows) {
    const nonEmpty = rows.filter((row) => row && row.length);
    if (!nonEmpty.length) return '';
    const width = Math.max(...nonEmpty.map((row) => row.length));
    const lines = [
      MarkdownTableRenderer._line(nonEmpty[0], width),
      MarkdownTableRenderer._line(Array(width).fill('---'), width, false),
      ...nonEmpty.slice(1).map((row) => MarkdownTableRenderer._line(row, width)),
    ];
    return `\n${lines.join('\n')}\n`;
  }

  static _line(cells, width, escape = true) {
    const padded = cells.slice();
    while (padded.length < width) padded.push('');
    const text = escape ? padded.map(MarkdownTableRenderer._escape) : padded;
    return `| ${text.join(' | ')} |`;
  }

  static _escape(cell) {
    return String(cell).replace(/\|/g, '\\|');
  }
}

module.exports = MarkdownTableRenderer;
