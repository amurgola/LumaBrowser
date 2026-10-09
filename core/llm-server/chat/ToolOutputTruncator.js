const TokenEstimator = require('../../shared/text/TokenEstimator');
const ContextBudget = require('../../shared/llm/ContextBudget');
const TruncationNotice = require('./tool-output/TruncationNotice');

class ToolOutputTruncator {
  static DEFAULT_MAX_LINES = 400;
  static DEFAULT_MAX_BYTES = 16 * 1024;
  static DEFAULT_MAX_LINE_LENGTH = 500;
  static BYTES_PER_LINE = 16;

  constructor(limits = {}) {
    this.maxLines = ToolOutputTruncator._positiveOr(limits.maxLines, ToolOutputTruncator.DEFAULT_MAX_LINES);
    this.maxBytes = ToolOutputTruncator._positiveOr(limits.maxBytes, ToolOutputTruncator.DEFAULT_MAX_BYTES);
    this.maxLineLength = ToolOutputTruncator._positiveOr(limits.maxLineLength, ToolOutputTruncator.DEFAULT_MAX_LINE_LENGTH);
  }

  static forSlotBudget(ctxPerSlotTokens, fraction = ContextBudget.SHARES.singleToolResult) {
    const tokens = ToolOutputTruncator._positiveOr(ctxPerSlotTokens, 0);
    if (!tokens) return new ToolOutputTruncator();
    const maxBytes = Math.floor(tokens * fraction * TokenEstimator.CHARS_PER_TOKEN);
    const maxLines = Math.max(ToolOutputTruncator.DEFAULT_MAX_LINES, Math.floor(maxBytes / ToolOutputTruncator.BYTES_PER_LINE));
    return new ToolOutputTruncator({ maxBytes, maxLines });
  }

  truncate(text, opts = {}) {
    const source = text == null ? '' : String(text);
    const strategy = opts.strategy === 'head' ? 'head' : 'tail';
    const lines = this._capLineLengths(source.split('\n'));
    const measured = { totalLines: lines.length, totalBytes: Buffer.byteLength(source, 'utf8') };
    if (!this._exceedsLimits(measured)) return ToolOutputTruncator._untouchedResult(lines.join('\n'), measured);
    const spilled = ToolOutputTruncator._spill(source, opts.spill);
    const window = spilled ? this._halved() : this;
    return window._truncatedResult(window._selectKeptLines(lines, strategy), measured, strategy, spilled);
  }

  _capLineLengths(lines) {
    return lines.map((line) => (line.length > this.maxLineLength
      ? `${line.slice(0, this.maxLineLength)}… (+${line.length - this.maxLineLength} chars)`
      : line));
  }

  _exceedsLimits(measured) {
    return measured.totalLines > this.maxLines || measured.totalBytes > this.maxBytes;
  }

  _halved() {
    return new ToolOutputTruncator({
      maxLines: Math.max(20, Math.floor(this.maxLines / 2)),
      maxBytes: Math.max(1024, Math.floor(this.maxBytes / 2)),
      maxLineLength: this.maxLineLength,
    });
  }

  _selectKeptLines(lines, strategy) {
    const ordered = strategy === 'tail' ? [...lines].reverse() : lines;
    const out = [];
    let bytes = 0;
    for (const line of ordered) {
      const lineBytes = Buffer.byteLength(line, 'utf8') + 1;
      if (out.length >= this.maxLines) break;
      if (bytes + lineBytes > this.maxBytes && out.length > 0) break;
      out.push(line);
      bytes += lineBytes;
    }
    return strategy === 'tail' ? out.reverse() : out;
  }

  _truncatedResult(keptLines, measured, strategy, spilled) {
    const text = keptLines.join('\n');
    return {
      text,
      truncated: true,
      truncatedBy: keptLines.length < this.maxLines ? 'bytes' : 'lines',
      totalLines: measured.totalLines,
      shownLines: keptLines.length,
      totalBytes: measured.totalBytes,
      shownBytes: Buffer.byteLength(text, 'utf8'),
      notice: TruncationNotice.build(keptLines.length, measured, strategy, spilled),
      spilledTo: spilled ? spilled.displayPath : null,
    };
  }

  static _spill(source, spill) {
    if (!spill || !spill.writer || typeof spill.writer.write !== 'function') return null;
    try {
      return spill.writer.write(spill.tool || 'output', spill.seq || 0, source, 'txt');
    } catch (_) {
      return null;
    }
  }

  static _untouchedResult(text, measured) {
    return {
      text,
      truncated: false,
      truncatedBy: null,
      totalLines: measured.totalLines,
      shownLines: measured.totalLines,
      totalBytes: measured.totalBytes,
      shownBytes: measured.totalBytes,
      notice: '',
      spilledTo: null,
    };
  }

  static _positiveOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }
}

module.exports = ToolOutputTruncator;
