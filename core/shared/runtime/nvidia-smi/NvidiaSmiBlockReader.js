const NvidiaSmiOutputParser = require('../NvidiaSmiOutputParser');

class NvidiaSmiBlockReader {
  constructor({ onBlock, expectedCount = 0, parseRow = (line) => NvidiaSmiOutputParser.parseGpuRow(line) } = {}) {
    this._onBlock = typeof onBlock === 'function' ? onBlock : () => {};
    this._parseRow = parseRow;
    this._tail = '';
    this._block = new Map();
    this._expectedCount = Number.isInteger(expectedCount) && expectedCount > 0 ? expectedCount : 0;
    this._malformed = 0;
  }

  get expectedCount() {
    return this._expectedCount;
  }

  get malformedLines() {
    return this._malformed;
  }

  hasPending() {
    return this._block.size > 0;
  }

  feed(chunk) {
    const text = this._tail + String(chunk == null ? '' : chunk);
    const lines = text.split(/\r?\n/);
    this._tail = lines.pop();
    for (const line of lines) this._takeLine(line);
  }

  flush() {
    if (!this._block.size) return false;
    const rows = [...this._block.values()].sort((a, b) => a.index - b.index);
    this._block = new Map();
    const complete = rows.length >= this._expectedCount;
    if (rows.length > this._expectedCount) this._expectedCount = rows.length;
    this._onBlock(rows, { complete });
    return true;
  }

  end() {
    if (this._tail.trim()) this._takeLine(this._tail);
    this._tail = '';
    this.flush();
  }

  reset() {
    this._tail = '';
    this._block = new Map();
  }

  _takeLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return;
    const row = this._parseRow(trimmed);
    if (!row || !Number.isInteger(row.index)) {
      this._malformed += 1;
      return;
    }
    if (this._block.has(row.index)) this.flush();
    this._block.set(row.index, row);
    if (this._expectedCount > 0 && this._block.size >= this._expectedCount) this.flush();
  }
}

module.exports = NvidiaSmiBlockReader;
