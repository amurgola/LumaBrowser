const GlanceText = require('./GlanceText');
const GlanceProviders = require('./GlanceProviders');

class GlanceService {
  static CACHE_MS = 10000;
  static TTL_SECONDS = 30;

  static DEFAULTS = {
    showCalendar: true,
    showQueue: true,
    showTasks: true,
    showRunning: true,
    showJobs: true,
    maxLineLength: 48,
    timeFormat: '12h',
    separator: ' · ',
    emptyText: '',
  };

  constructor(deps, { providers = GlanceProviders.ALL, now = () => new Date() } = {}) {
    this._deps = deps;
    this._providers = providers;
    this._now = now;
    this._cache = null;
    this._pending = null;
  }

  invalidate() {
    this._cache = null;
  }

  async get({ fresh = false } = {}) {
    const nowMs = this._now().getTime();
    if (!fresh && this._cache && nowMs - this._cache.at < GlanceService.CACHE_MS) return this._cache.value;
    if (!this._pending) {
      this._pending = this._build().then((value) => {
        this._cache = { at: this._now().getTime(), value };
        return value;
      }).finally(() => { this._pending = null; });
    }
    return this._pending;
  }

  settings() {
    const s = this._deps.settings;
    const out = {};
    for (const [key, def] of Object.entries(GlanceService.DEFAULTS)) {
      const value = s && typeof s.get === 'function' ? s.get(key, def) : def;
      out[key] = value === null || value === undefined ? def : value;
    }
    out.maxLineLength = Math.max(8, Math.min(200, parseInt(out.maxLineLength, 10) || GlanceService.DEFAULTS.maxLineLength));
    out.timeFormat = out.timeFormat === '24h' ? '24h' : '12h';
    out.separator = String(out.separator);
    out.emptyText = GlanceText.oneLine(out.emptyText);
    for (const p of this._providers) out[p.setting] = out[p.setting] !== false && out[p.setting] !== 'false';
    return out;
  }

  async _build() {
    const now = this._now();
    const cfg = this.settings();
    const segments = [];
    const lines = [];
    const tooltip = [];
    const items = { currentEvent: null, nextEvent: null, unreadCount: null, latestThread: null, dueTasks: null, runningJobs: null, jobs: null };
    const providers = [];
    for (const p of this._providers) {
      const api = typeof p.resolve === 'function' ? p.resolve(this._deps, (id) => this._api(id)) : this._api(p.extension);
      const state = { id: p.id, enabled: cfg[p.setting] !== false, available: !!api };
      providers.push(state);
      if (!state.enabled || !api) continue;
      try {
        const part = await p.collect({ api, now, timeFormat: cfg.timeFormat });
        if (!part) continue;
        Object.assign(items, part.items || {});
        if (part.segment) segments.push(part.segment);
        if (part.line) lines.push(GlanceService._clean(part.line));
        if (Array.isArray(part.tooltip)) tooltip.push(...part.tooltip);
      } catch (err) {
        state.error = (err && err.message) || String(err);
        this._log('warn', `provider ${p.id} failed`, state.error);
      }
    }
    const line = segments.length ? GlanceText.fit(segments, cfg.separator, cfg.maxLineLength) : GlanceText.clip(cfg.emptyText, cfg.maxLineLength);
    return {
      generatedAt: now.toISOString(),
      ttlSeconds: GlanceService.TTL_SECONDS,
      line,
      lines,
      tooltip: tooltip.length ? ['Luma', ...tooltip].join('\n') : '',
      items,
      providers,
    };
  }

  _api(extensionId) {
    let all = null;
    try { all = this._deps.extensions; } catch (_) { all = null; }
    const api = all && all[extensionId];
    return api && typeof api === 'object' ? api : null;
  }

  static _clean(line) {
    const out = {};
    for (const [k, v] of Object.entries(line)) if (v !== undefined && v !== null && v !== '') out[k] = v;
    return out;
  }

  _log(level, message, details) {
    const log = this._deps.log;
    if (log && typeof log[level] === 'function') log[level](message, details);
  }
}

module.exports = GlanceService;
