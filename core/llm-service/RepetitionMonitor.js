class RepetitionMonitor {
  static DEFAULTS = {
    maxPeriodLines: 40,
    repeatThreshold: 3,
    minBlockChars: 8,
    singleLineRepeatThreshold: 6,
    maxLines: 400,
    charWindow: 1600,
    charMinPeriod: 16,
    charRepeatThreshold: 4,
    charScanMinPartial: 80,
  };
  static MIN_DISTINCT_CHARS = 3;
  static LINE_BLOCK = 'line-block';
  static CHAR_CYCLE = 'char-cycle';

  constructor(options = {}) {
    this._config = { ...RepetitionMonitor.DEFAULTS, ...options };
    this.reset();
  }

  reset() {
    this._partial = '';
    this._lines = [];
    this._tail = '';
    this.tripped = false;
    this.reason = null;
  }

  push(text) {
    if (this.tripped || !text) return this.tripped;
    this._tail = (this._tail + text).slice(-this._config.charWindow * 2);
    this._partial += text;
    if (this._consumeCompletedLines()) return this._trip(RepetitionMonitor.LINE_BLOCK);
    if (this._partial.length >= this._config.charScanMinPartial && this._hasCharCycle()) {
      return this._trip(RepetitionMonitor.CHAR_CYCLE);
    }
    return false;
  }

  static normalizeLine(line) {
    return line.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  static _looksLikeContent(text) {
    if (!/[a-z0-9]/i.test(text)) return false;
    return new Set(text.replace(/\s+/g, '')).size >= RepetitionMonitor.MIN_DISTINCT_CHARS;
  }

  _trip(reason) {
    this.tripped = true;
    this.reason = reason;
    return true;
  }

  _consumeCompletedLines() {
    let newline;
    while ((newline = this._partial.indexOf('\n')) >= 0) {
      const line = RepetitionMonitor.normalizeLine(this._partial.slice(0, newline));
      this._partial = this._partial.slice(newline + 1);
      if (!line) continue;
      this._remember(line);
      if (this._hasLineCycle()) return true;
    }
    return false;
  }

  _remember(line) {
    this._lines.push(line);
    if (this._lines.length > this._config.maxLines) this._lines.shift();
  }

  _hasLineCycle() {
    const { repeatThreshold, singleLineRepeatThreshold, maxPeriodLines } = this._config;
    const maxPeriod = Math.min(maxPeriodLines, Math.floor(this._lines.length / repeatThreshold));
    for (let period = 1; period <= maxPeriod; period++) {
      const repeats = period === 1 ? Math.max(repeatThreshold, singleLineRepeatThreshold) : repeatThreshold;
      if (this._tailRepeats(period, repeats) && this._isSubstantial(this._tailBlock(period))) return true;
    }
    return false;
  }

  _tailRepeats(period, repeats) {
    const count = this._lines.length;
    if (count < repeats * period) return false;
    for (let k = 1; k < repeats; k++) {
      for (let j = 0; j < period; j++) {
        if (this._lines[count - 1 - j] !== this._lines[count - 1 - j - k * period]) return false;
      }
    }
    return true;
  }

  _tailBlock(period) {
    return this._lines.slice(this._lines.length - period).join('');
  }

  _isSubstantial(block) {
    return block.length >= this._config.minBlockChars && RepetitionMonitor._looksLikeContent(block);
  }

  _hasCharCycle() {
    const { charWindow, charMinPeriod, charRepeatThreshold } = this._config;
    const tail = this._tail.slice(-charWindow);
    const maxPeriod = Math.floor(tail.length / charRepeatThreshold);
    for (let period = charMinPeriod; period <= maxPeriod; period++) {
      const block = tail.slice(tail.length - period);
      if (RepetitionMonitor._endsWithRepeats(tail, block, charRepeatThreshold) && this._isSubstantial(block.trim())) return true;
    }
    return false;
  }

  static _endsWithRepeats(text, block, repeats) {
    const period = block.length;
    const end = text.length;
    for (let k = 1; k < repeats; k++) {
      if (text.slice(end - period - k * period, end - k * period) !== block) return false;
    }
    return true;
  }
}

module.exports = RepetitionMonitor;
