const ValueStats = require('./ValueStats');
const RangeTracker = require('./RangeTracker');
const DistinctCounter = require('./DistinctCounter');
const StringPreview = require('../StringPreview');

class StringStats extends ValueStats {
  static CATEGORY_MAX_CHARS = 24;

  constructor() {
    super();
    this.lengths = new RangeTracker();
    this.distinct = new DistinctCounter();
  }

  describe() {
    if (this.distinct.isConstant) return this._constant('string', StringPreview.quote(this.distinct.first()));
    const choices = this._categories();
    if (choices) return `string, one of ${choices.map((c) => JSON.stringify(c)).join(', ')}`;
    return `string ${this.lengths.phrase()} chars, ${this.distinct.label()}`;
  }

  detail() {
    if (this.count === 0 || this.distinct.isConstant || this._categories()) return '';
    return `, e.g. ${StringPreview.quote(this.distinct.first())}`;
  }

  _observe(text) {
    this.lengths.observe(text.length);
    this.distinct.add(text);
  }

  _categories() {
    if (this.lengths.max > StringStats.CATEGORY_MAX_CHARS) return null;
    return this.distinct.enumeration(this.count);
  }
}

module.exports = StringStats;
