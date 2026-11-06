const HistoryStore = require('./HistoryStore');

class HistoryService {
  static DEFAULT_DEDUPE_WINDOW_MS = 30000;

  static TOP_SITES_DAYS = 90;

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

  topSites({ limit = 8, hiddenHosts = [], now = Date.now() } = {}) {
    const since = new Date(now - HistoryService.TOP_SITES_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const hidden = new Set(hiddenHosts);
    const byHost = new Map();
    for (const row of this._store.topUrls({ since })) {
      let host;
      try { host = new URL(row.url).hostname.replace(/^www\./, ''); } catch (_) { continue; }
      if (!host || hidden.has(host)) continue;
      const site = byHost.get(host);
      if (!site) byHost.set(host, { url: row.url, title: row.title, host, visits: row.visitCount, best: row.visitCount });
      else {
        site.visits += row.visitCount;
        if (row.visitCount > site.best) Object.assign(site, { url: row.url, title: row.title || site.title, best: row.visitCount });
      }
    }
    return [...byHost.values()].sort((a, b) => b.visits - a.visits).slice(0, limit)
      .map(({ url, title, host, visits }) => ({ url, title, host, visits }));
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
