class MarkdownBlockScanner {
  static HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
  static FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;
  static TABLE_ROW = /^ {0,3}\|/;

  scan(source) {
    this._lines = MarkdownBlockScanner._lines(source);
    this._blocks = [];
    let index = 0;
    while (index < this._lines.length) index = this._readBlockAt(index);
    return this._blocks;
  }

  _readBlockAt(index) {
    const line = this._lines[index];
    if (!line.text.trim()) return index + 1;
    if (MarkdownBlockScanner.HEADING.test(line.text)) return this._readHeading(index);
    if (MarkdownBlockScanner.FENCE_OPEN.test(line.text)) return this._readFence(index);
    if (MarkdownBlockScanner.TABLE_ROW.test(line.text)) return this._readRun(index, 'table', (text) => MarkdownBlockScanner.TABLE_ROW.test(text));
    return this._readRun(index, 'prose', (text) => MarkdownBlockScanner._continuesProse(text));
  }

  _readHeading(index) {
    const line = this._lines[index];
    const [, hashes, title = ''] = line.text.match(MarkdownBlockScanner.HEADING);
    this._blocks.push({ kind: 'heading', start: line.start, end: line.end, level: hashes.length, title: title.trim() });
    return index + 1;
  }

  _readFence(index) {
    const marker = this._lines[index].text.match(MarkdownBlockScanner.FENCE_OPEN)[1];
    const closer = new RegExp(`^ {0,3}${marker[0] === '`' ? '`' : '~'}{${marker.length},}[ \\t]*$`);
    let last = index + 1;
    while (last < this._lines.length && !closer.test(this._lines[last].text)) last++;
    last = Math.min(last, this._lines.length - 1);
    this._push('fence', index, last);
    return last + 1;
  }

  _readRun(index, kind, continues) {
    let last = index;
    while (last + 1 < this._lines.length && continues(this._lines[last + 1].text)) last++;
    this._push(kind, index, last);
    return last + 1;
  }

  _push(kind, firstLine, lastLine) {
    this._blocks.push({ kind, start: this._lines[firstLine].start, end: this._lines[lastLine].end });
  }

  static _continuesProse(text) {
    if (!text.trim()) return false;
    return ![MarkdownBlockScanner.HEADING, MarkdownBlockScanner.FENCE_OPEN, MarkdownBlockScanner.TABLE_ROW]
      .some((pattern) => pattern.test(text));
  }

  static _lines(source) {
    const lines = [];
    let start = 0;
    while (start <= source.length) {
      const newline = source.indexOf('\n', start);
      const stop = newline === -1 ? source.length : newline;
      const end = stop > start && source[stop - 1] === '\r' ? stop - 1 : stop;
      lines.push({ start, end, text: source.slice(start, end) });
      if (newline === -1) break;
      start = newline + 1;
    }
    return lines;
  }
}

module.exports = MarkdownBlockScanner;
