class RangeTracker {
  static SIGNIFICANT_DIGITS = 6;

  constructor() {
    this.min = Infinity;
    this.max = -Infinity;
  }

  observe(n) {
    if (n < this.min) this.min = n;
    if (n > this.max) this.max = n;
  }

  get isEmpty() {
    return this.min > this.max;
  }

  phrase() {
    if (this.isEmpty) return '?';
    const low = RangeTracker.format(this.min);
    return this.min === this.max ? low : `${low}..${RangeTracker.format(this.max)}`;
  }

  static format(n) {
    return Number.isInteger(n) ? String(n) : String(Number(n.toPrecision(RangeTracker.SIGNIFICANT_DIGITS)));
  }
}

module.exports = RangeTracker;
