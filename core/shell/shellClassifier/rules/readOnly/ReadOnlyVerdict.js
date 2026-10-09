class ReadOnlyVerdict {
  constructor(readOnly, reason) {
    this.readOnly = readOnly;
    this.reason = reason;
    Object.freeze(this);
  }

  static reads(reason) {
    return new ReadOnlyVerdict(true, reason);
  }

  static refuses(reason) {
    return new ReadOnlyVerdict(false, reason);
  }
}

module.exports = ReadOnlyVerdict;
