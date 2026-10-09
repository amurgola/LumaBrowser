const crypto = require('crypto');

class ApiKeyEntry {
  static MAX_LABEL = 120;
  static DEFAULT_LABEL = 'Untitled key';

  static create(label, now = new Date()) {
    return {
      id: crypto.randomUUID(),
      label: ApiKeyEntry.cleanLabel(label),
      key: ApiKeyEntry.generateValue(),
      createdAt: now.toISOString(),
      lastUsedAt: null,
    };
  }

  static refreshed(entry, now = new Date()) {
    return { ...entry, key: ApiKeyEntry.generateValue(), createdAt: now.toISOString(), lastUsedAt: null };
  }

  static relabeled(entry, label) {
    return { ...entry, label: ApiKeyEntry.cleanLabel(label) };
  }

  static generateValue() {
    return 'luma_' + crypto.randomBytes(32).toString('hex');
  }

  static cleanLabel(label) {
    return String(label || '').slice(0, ApiKeyEntry.MAX_LABEL).trim() || ApiKeyEntry.DEFAULT_LABEL;
  }

  static fromHeaders(headers) {
    const all = headers || {};
    return ApiKeyEntry._bearer(all['authorization']) || ApiKeyEntry._xApiKey(all['x-api-key']);
  }

  static _bearer(auth) {
    if (typeof auth !== 'string') return null;
    const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
    return match ? match[1].trim() : null;
  }

  static _xApiKey(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    return value.trim();
  }
}

module.exports = ApiKeyEntry;
