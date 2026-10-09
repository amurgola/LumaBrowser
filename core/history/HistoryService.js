const HistoryStore = require('./HistoryStore');

class HistoryService {
  static DEFAULT_DEDUPE_WINDOW_MS = 30000;

  constructor(settingsDb, { dedupeWindowMs = HistoryService.DEFAULT_DEDUPE_WINDOW_MS } = {}) {
    this._store = new HistoryStore(settingsDb);
    this._dedupeWindowMs = dedupeWindowMs;
  }

  recordVisit(url, title) {
    if (!HistoryService.isRecordable(url)) return null;
    if (this._isRecentRepeat(url)) return null;
    return this._store.addVisit({ url, title });
  }

  updateVisitTitle(visitId, title) {
    const clean = title ? String(title).trim() : '';
    if (!visitId || !clean) return false;
    return this._store.updateTitle(visitId, clean);
  }

  list(opts = {}) {
    return this._store.list(opts);
  }

  suggest(query, opts = {}) {
    return this._store.suggest(query, opts);
  }

  deleteEntry(id) {
    return this._store.deleteById(id);
  }

  deleteUrl(url) {
    return this._store.deleteByUrl(url);
  }

  clear(opts = {}) {
    return this._store.clear(opts);
  }

  static isRecordable(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed || trimmed === 'about:blank') return false;
    return /^https?:\/\//i.test(trimmed);
  }

  _isRecentRepeat(url) {
    const last = this._store.lastVisitedAt(url);
    if (!last) return false;
    const age = Date.now() - (Date.parse(last) || 0);
    return age >= 0 && age < this._dedupeWindowMs;
  }
}

module.exports = HistoryService;
