class KvCacheModes {
  static MODES = [
    {
      id: 'f16',
      k: 'f16',
      v: 'f16',
      short: 'f16 KV',
      label: 'f16 - full precision',
      help: 'Full-precision KV cache: 2 bytes per element, no quality question at all, and the largest context footprint.',
    },
    {
      id: 'q8_0',
      k: 'q8_0',
      v: 'q8_0',
      short: 'q8 KV',
      label: 'fp8 (q8_0) - about half the KV VRAM',
      help: 'Both keys and values at q8_0, about 1.06 bytes per element. Roughly half the KV footprint of f16 for a quality cost small enough that it is the usual default on long contexts.',
    },
    {
      id: 'q8q4',
      k: 'q8_0',
      v: 'q4_0',
      short: 'q8/q4 KV',
      label: 'q8 keys / q4 values - about a third of f16',
      help: 'Keys stay at q8_0 and only the values drop to q4_0. Supported, but NOT offered on this build: it collapses prompt processing (see the note above).',
      offered: false,
    },
  ];

  static MODE_IDS = KvCacheModes.MODES.map((mode) => mode.id);
  static OFFERED_MODES = KvCacheModes.MODES.filter((mode) => mode.offered !== false);
  static OFFERED_MODE_IDS = KvCacheModes.OFFERED_MODES.map((mode) => mode.id);

  static mode(id) {
    const key = KvCacheModes._normalizeId(id);
    return KvCacheModes.MODES.find((mode) => mode.id === key) || null;
  }

  static pair(id) {
    const mode = KvCacheModes.mode(id);
    return mode ? { k: mode.k, v: mode.v } : { k: 'f16', v: 'f16' };
  }

  static idFor(k, v) {
    const keyType = String(k || 'f16');
    const valueType = String(v || 'f16');
    const hit = KvCacheModes.MODES.find((mode) => mode.k === keyType && mode.v === valueType);
    return hit ? hit.id : null;
  }

  static shortLabel(id) {
    const mode = KvCacheModes.mode(id);
    return mode ? mode.short : 'f16 KV';
  }

  static _normalizeId(id) {
    return String(id || '').trim();
  }
}

module.exports = KvCacheModes;
