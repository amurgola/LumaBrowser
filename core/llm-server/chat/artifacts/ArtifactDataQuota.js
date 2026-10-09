class ArtifactDataQuota {
  static MAX_KEYS = 256;
  static MAX_KEY_LEN = 128;
  static MAX_VALUE_BYTES = 64 * 1024;
  static MAX_TOTAL_BYTES = 512 * 1024;

  static checkEntry(key, value) {
    if (!key || typeof key !== 'string') return 'store keys must be non-empty strings';
    if (key.length > ArtifactDataQuota.MAX_KEY_LEN) {
      return `store quota exceeded: key "${key.slice(0, 40)}…" is ${key.length} chars (max ${ArtifactDataQuota.MAX_KEY_LEN})`;
    }
    if (value === undefined) return `value for "${key}" is undefined; store null instead, or remove the key`;
    return ArtifactDataQuota._checkValueSize(key, value);
  }

  static checkObject(data, serialized) {
    if (serialized.length > ArtifactDataQuota.MAX_TOTAL_BYTES) {
      return ArtifactDataQuota._exceeded(`total data would be ${serialized.length} bytes (max ${ArtifactDataQuota.MAX_TOTAL_BYTES}); remove keys or store less`);
    }
    const keys = Object.keys(data).length;
    if (keys > ArtifactDataQuota.MAX_KEYS) return ArtifactDataQuota._exceeded(`object would hold ${keys} keys (max ${ArtifactDataQuota.MAX_KEYS})`);
    return null;
  }

  static _checkValueSize(key, value) {
    let serialized;
    try {
      serialized = JSON.stringify(value);
    } catch (err) {
      return `value for "${key}" is not JSON-serializable: ${err.message}`;
    }
    if (serialized === undefined) return `value for "${key}" is not JSON-serializable (functions/symbols cannot be stored)`;
    if (serialized.length > ArtifactDataQuota.MAX_VALUE_BYTES) {
      return ArtifactDataQuota._exceeded(`value for "${key}" is ${serialized.length} bytes (max ${ArtifactDataQuota.MAX_VALUE_BYTES})`);
    }
    return null;
  }

  static _exceeded(detail) {
    return `store quota exceeded: ${detail}`;
  }
}

module.exports = ArtifactDataQuota;
