class VaultRedactor {
  static MIN_LENGTH = 6;

  constructor(getSecrets) {
    this._getSecrets = getSecrets;
  }

  redact(text) {
    if (typeof text !== 'string' || !text) return text;
    let out = text;
    for (const { value, name } of this._secrets()) {
      if (out.includes(value)) out = out.split(value).join(`[vault:${name}]`);
    }
    return out;
  }

  redactDeep(value, depth = 0) {
    if (typeof value === 'string') return this.redact(value);
    if (depth > 8 || !value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((v) => this.redactDeep(v, depth + 1));
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = this.redactDeep(v, depth + 1);
    return out;
  }

  _secrets() {
    let list = [];
    try { list = this._getSecrets() || []; } catch (_) { list = []; }
    return list
      .filter((s) => s && typeof s.value === 'string' && s.value.length >= VaultRedactor.MIN_LENGTH)
      .sort((a, b) => b.value.length - a.value.length);
  }
}

module.exports = VaultRedactor;
