class DistinctCounter {
  static DEFAULT_CAP = 100;
  static ENUM_MAX = 5;

  constructor(cap = DistinctCounter.DEFAULT_CAP) {
    this._cap = cap;
    this._values = new Set();
    this._overflowed = false;
  }

  add(value) {
    if (this._values.has(value)) return;
    if (this._values.size >= this._cap) {
      this._overflowed = true;
      return;
    }
    this._values.add(value);
  }

  get count() {
    return this._values.size;
  }

  get isConstant() {
    return this.count === 1 && !this._overflowed;
  }

  first() {
    return this._values.values().next().value;
  }

  label() {
    return `${this.count}${this._overflowed ? '+' : ''} distinct`;
  }

  enumeration(observations) {
    const few = !this._overflowed && this.count <= DistinctCounter.ENUM_MAX;
    return few && observations > this.count ? [...this._values] : null;
  }
}

module.exports = DistinctCounter;
