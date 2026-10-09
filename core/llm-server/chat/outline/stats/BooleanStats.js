const ValueStats = require('./ValueStats');

class BooleanStats extends ValueStats {
  constructor() {
    super();
    this.trueCount = 0;
  }

  describe() {
    const falseCount = this.count - this.trueCount;
    if (this.trueCount === 0 || falseCount === 0) return this._constant('boolean', String(this.trueCount > 0));
    return `boolean (${this.trueCount} true, ${falseCount} false)`;
  }

  _observe(flag) {
    if (flag) this.trueCount++;
  }
}

module.exports = BooleanStats;
