class VaultRedaction {
  static _redactor = null;

  static install(redactor) {
    VaultRedaction._redactor = redactor && typeof redactor.redactDeep === 'function' ? redactor : null;
  }

  static apply(value) {
    const r = VaultRedaction._redactor;
    if (!r) return value;
    try { return r.redactDeep(value); } catch (_) { return value; }
  }
}

module.exports = VaultRedaction;
