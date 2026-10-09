class RuntimeLogRing {
  static LIMIT = 400;
  static ERROR_TAIL_LINES = 15;

  constructor(limit = RuntimeLogRing.LIMIT) {
    this._limit = limit;
    this.entries = [];
  }

  capture(stream, chunk, now = Date.now()) {
    const added = [];
    for (const line of String(chunk).split(/\r?\n/)) {
      if (!line) continue;
      const entry = { ts: now, stream, line };
      this._push(entry);
      added.push(entry);
    }
    return added;
  }

  clear() {
    this.entries = [];
  }

  snapshot() {
    return this.entries.slice();
  }

  errorTail(processNoun, limit = RuntimeLogRing.ERROR_TAIL_LINES) {
    const lines = this.entries
      .filter((e) => e.stream === 'stderr')
      .slice(-limit)
      .map((e) => e.line);
    return lines.length ? `--- ${processNoun} output (tail) ---\n${lines.join('\n')}` : '';
  }

  _push(entry) {
    this.entries.push(entry);
    if (this.entries.length > this._limit) this.entries.shift();
  }
}

module.exports = RuntimeLogRing;
