class RecordId {
  static RANDOM_LENGTH = 7;

  static create(prefix) {
    return `${prefix}_${Date.now()}_${RecordId._randomSuffix()}`;
  }

  static _randomSuffix() {
    return Math.random().toString(36).slice(2, 2 + RecordId.RANDOM_LENGTH);
  }
}

module.exports = RecordId;
