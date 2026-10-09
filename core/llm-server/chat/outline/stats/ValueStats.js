class ValueStats {
  static ALWAYS = ' (always)';

  constructor() {
    this.count = 0;
  }

  observe(value) {
    this.count++;
    this._observe(value);
  }

  describe() {
    throw new Error(`${this.constructor.name}.describe is abstract`);
  }

  detail() {
    return '';
  }

  _constant(kind, valueText) {
    return `${kind} ${valueText}${this.count > 1 ? ValueStats.ALWAYS : ''}`;
  }

  _observe() {
    throw new Error(`${this.constructor.name}._observe is abstract`);
  }
}

module.exports = ValueStats;
