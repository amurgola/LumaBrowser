class KvCacheType {
  static TYPES = new Set(['f16', 'q8_0', 'q4_0']);

  static ELEMENT_BYTES = { q8_0: 1.0625, q4_0: 0.5625 };

  static F16_ELEMENT_BYTES = 2;

  static normalize(value) {
    if (!value) return null;
    const type = String(value).trim().toLowerCase();
    return KvCacheType.TYPES.has(type) ? type : null;
  }

  static elementBytes(type) {
    if (type === 'q8_0') return KvCacheType.ELEMENT_BYTES.q8_0;
    if (type === 'q4_0') return KvCacheType.ELEMENT_BYTES.q4_0;
    return KvCacheType.F16_ELEMENT_BYTES;
  }

  static isQuantized(type) {
    return !!type && type !== 'f16';
  }
}

module.exports = KvCacheType;
