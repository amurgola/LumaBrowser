class LineDiff {
  static DEFAULT_CONTEXT = 3;
  static DEFAULT_MAX_LINES = 4000;
  static DEFAULT_MAX_HUNKS = 12;

  static diff(before, after, options = {}) {
    if (typeof before !== 'string' || typeof after !== 'string') return null;
    if (before === after) return LineDiff._emptyDiff();
    const settings = LineDiff._readOptions(options);
    const oldLines = LineDiff._splitLines(before);
    const newLines = LineDiff._splitLines(after);
    if (oldLines.length > settings.maxLines || newLines.length > settings.maxLines) return null;
    return LineDiff._summarize(LineDiff._lcsOps(oldLines, newLines), settings);
  }

  static _emptyDiff() {
    return { added: 0, removed: 0, hunks: [], truncated: false };
  }

  static _readOptions(options) {
    const intOr = (value, fallback) => (Number.isInteger(value) ? value : fallback);
    return {
      context: intOr(options.context, LineDiff.DEFAULT_CONTEXT),
      maxLines: intOr(options.maxLines, LineDiff.DEFAULT_MAX_LINES),
      maxHunks: intOr(options.maxHunks, LineDiff.DEFAULT_MAX_HUNKS),
    };
  }

  static _splitLines(text) {
    return text.replace(/\r\n/g, '\n').split('\n');
  }

  static _summarize(ops, settings) {
    const added = ops.filter((o) => o.op === '+').length;
    const removed = ops.filter((o) => o.op === '-').length;
    if (added === 0 && removed === 0) return LineDiff._emptyDiff();
    const ranges = LineDiff._groupIntoRanges(ops, settings.context);
    const hunks = LineDiff._buildHunks(ops, ranges, settings.maxHunks);
    return { added, removed, hunks, truncated: hunks.length < ranges.length };
  }

  static _lcsOps(a, b) {
    const table = LineDiff._lcsTable(a, b);
    const ops = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { ops.push({ op: ' ', text: a[i] }); i++; j++; }
      else if (table[i + 1][j] >= table[i][j + 1]) { ops.push({ op: '-', text: a[i] }); i++; }
      else { ops.push({ op: '+', text: b[j] }); j++; }
    }
    for (; i < a.length; i++) ops.push({ op: '-', text: a[i] });
    for (; j < b.length; j++) ops.push({ op: '+', text: b[j] });
    return ops;
  }

  static _lcsTable(a, b) {
    const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        table[i][j] = a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
    return table;
  }

  static _groupIntoRanges(ops, context) {
    const ranges = [];
    ops.forEach((o, index) => {
      if (o.op === ' ') return;
      const start = Math.max(0, index - context);
      const end = Math.min(ops.length - 1, index + context);
      const last = ranges[ranges.length - 1];
      if (last && start <= last.end + 1) last.end = Math.max(last.end, end);
      else ranges.push({ start, end });
    });
    return ranges;
  }

  static _buildHunks(ops, ranges, maxHunks) {
    const position = { cursor: 0, oldLine: 1, newLine: 1 };
    const hunks = [];
    for (const range of ranges) {
      LineDiff._advance(ops, position, range.start);
      const oldStart = position.oldLine;
      const newStart = position.newLine;
      const lines = ops.slice(range.start, range.end + 1).map((o) => ({ op: o.op, text: o.text }));
      LineDiff._advance(ops, position, range.end + 1);
      hunks.push({ oldStart, newStart, lines });
      if (hunks.length >= maxHunks) break;
    }
    return hunks;
  }

  static _advance(ops, position, until) {
    for (; position.cursor < until; position.cursor++) {
      const o = ops[position.cursor];
      if (o.op !== '+') position.oldLine++;
      if (o.op !== '-') position.newLine++;
    }
  }
}

module.exports = LineDiff;
