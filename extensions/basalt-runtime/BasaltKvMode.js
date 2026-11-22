class BasaltKvMode {
  static SIXTEEN_BIT = /^(f16|bf16|f32)$/i;
  static EIGHT_BIT = /^q8/i;
  static FOUR_BIT = /^(q4|q5|iq4)/i;
  static BY_WIDTH = { 16: ['fp16'], 8: ['int8', 'fp8'], 4: ['q4_0', 'int8', 'fp8'] };

  static resolve({ pack, cacheType, slots = 1 }) {
    if (!pack || !pack.kv) return { kv: null, note: null };
    const wanted = BasaltKvMode._forWidth(pack, BasaltKvMode._width(cacheType)) || pack.kv.default;
    if (slots > 1 && pack.kv.parallel && wanted !== pack.kv.parallel) {
      return { kv: pack.kv.parallel, note: `KV cache ${pack.kv.parallel} instead of ${wanted}: this model serves more than one slot only with ${pack.kv.parallel}.` };
    }
    return { kv: wanted, note: null };
  }

  static bytesPerPosition(pack, kv) {
    const value = pack && pack.kv && pack.kv.formats ? pack.kv.formats[kv] : null;
    return Number(value) > 0 ? Number(value) : null;
  }

  static _width(cacheType) {
    const type = String(cacheType || '');
    if (BasaltKvMode.SIXTEEN_BIT.test(type)) return 16;
    if (BasaltKvMode.EIGHT_BIT.test(type)) return 8;
    if (BasaltKvMode.FOUR_BIT.test(type)) return 4;
    return null;
  }

  static _forWidth(pack, width) {
    if (!width) return null;
    const formats = Object.keys(pack.kv.formats || {});
    return BasaltKvMode.BY_WIDTH[width].find((name) => formats.includes(name)) || null;
  }
}

module.exports = BasaltKvMode;
