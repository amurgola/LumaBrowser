const ValueStats = require('./ValueStats');
const RangeTracker = require('./RangeTracker');
const DistinctCounter = require('./DistinctCounter');

class NumberStats extends ValueStats {
  constructor() {
    super();
    this.range = new RangeTracker();
    this.distinct = new DistinctCounter();
    this.allIntegers = true;
  }

  describe() {
    const kind = this.allIntegers ? 'integer' : 'number';
    if (this.distinct.isConstant) return this._constant(kind, RangeTracker.format(this.distinct.first()));
    const choices = this.distinct.enumeration(this.count);
    if (choices) return `${kind}, one of ${choices.map(RangeTracker.format).join(', ')}`;
    return `${kind} ${this.range.phrase()}, ${this.distinct.label()}`;
  }

  _observe(n) {
    this.range.observe(n);
    this.distinct.add(n);
    if (!Number.isInteger(n)) this.allIntegers = false;
  }
}

module.exports = NumberStats;
