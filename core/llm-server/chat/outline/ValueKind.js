class ValueKind {
  static ORDER = ['object', 'array', 'string', 'number', 'boolean', 'null'];
  static NAMED_BY_TYPEOF = ['object', 'string', 'boolean'];

  static normalize(value) {
    return (value && typeof value.toJSON === 'function') ? value.toJSON() : value;
  }

  static of(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'number') return Number.isFinite(value) ? 'number' : 'null';
    return ValueKind.NAMED_BY_TYPEOF.includes(typeof value) ? typeof value : 'absent';
  }

  static isPresent(value) {
    return ValueKind.of(ValueKind.normalize(value)) !== 'absent';
  }
}

module.exports = ValueKind;
