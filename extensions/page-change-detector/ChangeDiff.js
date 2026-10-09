const crypto = require('crypto');

class ChangeDiff {
  static MAX_LINES_PER_KIND = 4;
  static MAX_LINE_CHARS = 140;
  static ELLIPSIS = String.fromCharCode(0x2026);

  static checksum(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  static summarize(oldText, newText) {
    if (!oldText) return `initial snapshot (${newText.length} chars)`;
    const oldLines = ChangeDiff._lines(oldText);
    const newLines = ChangeDiff._lines(newText);
    const added = ChangeDiff._missingFrom(newLines, oldLines);
    const removed = ChangeDiff._missingFrom(oldLines, newLines);
    return ChangeDiff._stats(added, removed) + ChangeDiff._snippet(added, removed);
  }

  static _lines(text) {
    return text.split('\n').map((l) => l.trim()).filter(Boolean);
  }

  static _missingFrom(lines, other) {
    const otherSet = new Set(other);
    return lines.filter((l) => !otherSet.has(l));
  }

  static _stats(added, removed) {
    const stats = [];
    if (added.length > 0) stats.push(`+${added.length}`);
    if (removed.length > 0) stats.push(`-${removed.length}`);
    if (stats.length === 0) stats.push('whitespace / formatting only');
    return stats.join(' / ');
  }

  static _snippet(added, removed) {
    const lines = [
      ...added.slice(0, ChangeDiff.MAX_LINES_PER_KIND).map((s) => '+ ' + ChangeDiff._trim(s)),
      ...removed.slice(0, ChangeDiff.MAX_LINES_PER_KIND).map((s) => '- ' + ChangeDiff._trim(s)),
    ];
    return lines.length ? '\n' + lines.join('\n') : '';
  }

  static _trim(line) {
    return line.length > ChangeDiff.MAX_LINE_CHARS ? line.substring(0, ChangeDiff.MAX_LINE_CHARS) + ChangeDiff.ELLIPSIS : line;
  }
}

module.exports = ChangeDiff;
