const SettingsValueStore = require('../database/SettingsValueStore');

class UsageStore extends SettingsValueStore {
  static STORAGE_KEY = 'core.sharing.usage';

  constructor(db) {
    super(db, UsageStore.STORAGE_KEY);
  }

  record(tokenId, { tokens = 0, images = 0, videos = 0 } = {}) {
    if (!tokenId) return;
    const delta = UsageStore._counters({ totalTokens: tokens, images, videos });
    if (!delta.totalTokens && !delta.images && !delta.videos) return;
    this._addToClient(tokenId, delta);
  }

  get(tokenId) {
    const entry = this._read()[tokenId] || {};
    return { ...UsageStore._counters(entry), updatedAt: entry.updatedAt || null };
  }

  remove(tokenId) {
    const all = this._read();
    if (!(tokenId in all)) return;
    delete all[tokenId];
    this._write(all);
  }

  _emptyValue() {
    return {};
  }

  _hasValidShape(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  _addToClient(tokenId, delta) {
    const all = this._read();
    const current = UsageStore._counters(all[tokenId] || {});
    all[tokenId] = {
      totalTokens: current.totalTokens + delta.totalTokens,
      images: current.images + delta.images,
      videos: current.videos + delta.videos,
      updatedAt: new Date().toISOString(),
    };
    this._write(all);
  }

  static _counters({ totalTokens, images, videos }) {
    return {
      totalTokens: UsageStore._toCount(totalTokens),
      images: UsageStore._toCount(images),
      videos: UsageStore._toCount(videos),
    };
  }

  static _toCount(value) {
    const count = Math.floor(Number(value));
    return Number.isFinite(count) && count > 0 ? count : 0;
  }
}

module.exports = UsageStore;
