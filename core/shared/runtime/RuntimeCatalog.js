const crypto = require('crypto');

class RuntimeCatalog {
  static FINGERPRINT_LENGTH = 16;

  constructor(runtimes) {
    this._runtimes = runtimes;
    this._cachedFingerprint = null;
  }

  getCatalog() {
    return this._runtimes;
  }

  getById(id) {
    return this._runtimes.find((r) => r.id === id) || null;
  }

  platformKey() {
    return `${process.platform}-${process.arch}`;
  }

  getAssetPattern(entry) {
    if (!entry || !entry.assetPatterns) return null;
    return entry.assetPatterns[this.platformKey()] || null;
  }

  getRepo(entry) {
    if (!entry) return null;
    const override = entry.repos && entry.repos[this.platformKey()];
    return override || entry.repo || null;
  }

  getCompanionAssetPatterns(entry) {
    const value = entry && entry.companionAssets && entry.companionAssets[this.platformKey()];
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  getBinaryNames(entry) {
    if (!entry || !entry.binaryNames) return [];
    return entry.binaryNames[process.platform] || [];
  }

  fingerprint() {
    if (!this._cachedFingerprint) this._cachedFingerprint = RuntimeCatalog.hashDeclaration(this._runtimes);
    return this._cachedFingerprint;
  }

  static hashDeclaration(value, length = RuntimeCatalog.FINGERPRINT_LENGTH) {
    const canonical = JSON.stringify(value, (key, v) => (v instanceof RegExp ? String(v) : v));
    return crypto.createHash('sha1').update(canonical).digest('hex').slice(0, length);
  }
}

module.exports = RuntimeCatalog;
