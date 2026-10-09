const RecordId = require('../../../core/database/RecordId');
const OAuthProviders = require('./oauth/OAuthProviders');

class CalendarService {
  static ID_PREFIX = 'cal';
  static MIN_INTERVAL_MS = 5 * 60 * 1000;
  static MAX_INTERVAL_MS = 24 * 60 * 60 * 1000;
  static DEFAULT_INTERVAL_MS = 15 * 60 * 1000;
  static WINDOW_PAST_MS = 30 * 24 * 60 * 60 * 1000;
  static WINDOW_FUTURE_MS = 120 * 24 * 60 * 60 * 1000;
  static DEFAULT_DAYS = 14;
  static SECRET_SUFFIX = ':clientSecret';

  constructor({ sources, events, secrets, providers, oauth, tokens, emit = () => {}, getRedirectUri = () => '', fetchImpl = null, now = () => Date.now() } = {}) {
    this._sources = sources;
    this._events = events;
    this._secrets = secrets;
    this._providers = providers || {};
    this._oauth = oauth;
    this._tokens = tokens;
    this._emit = emit;
    this._getRedirectUri = getRedirectUri;
    this._fetch = fetchImpl;
    this._now = now;
  }

  static secretId(sourceId) {
    return `hub:cal:${sourceId}${CalendarService.SECRET_SUFFIX}`;
  }

  static clampInterval(ms) {
    const n = parseInt(ms, 10);
    if (!Number.isFinite(n)) return CalendarService.DEFAULT_INTERVAL_MS;
    return Math.min(CalendarService.MAX_INTERVAL_MS, Math.max(CalendarService.MIN_INTERVAL_MS, n));
  }

  listSources() {
    return this._sources.list().map((source) => this._present(source));
  }

  getSource(id) {
    const source = this._sources.get(id);
    return source ? this._present(source) : null;
  }

  dueSources(nowIso) {
    return this._sources.due(nowIso || new Date(this._now()).toISOString());
  }

  addSource({ kind, label, color = '', config = {}, intervalMs } = {}) {
    const provider = this._provider(kind);
    const name = String(label || '').trim();
    if (!name) throw new Error('A calendar needs a label');
    const { clean, clientSecret } = CalendarService._splitSecret(config);
    const problem = provider.validateConfig(clean);
    if (problem) throw new Error(problem);
    const id = RecordId.create(CalendarService.ID_PREFIX);
    if (clientSecret) this._secrets.set(CalendarService.secretId(id), clientSecret);
    this._sources.insert({ id, kind, label: name, color: String(color || ''), config: clean, enabled: true, intervalMs: CalendarService.clampInterval(intervalMs) });
    this._emit('calendar.changed', { sourceId: id });
    return this.getSource(id);
  }

  updateSource(id, patch = {}) {
    const current = this._sources.get(id);
    if (!current) throw new Error('calendar not found');
    const columns = {};
    if (patch.label != null && String(patch.label).trim()) columns.label = String(patch.label).trim();
    if (patch.color != null) columns.color = String(patch.color);
    if (patch.enabled !== undefined) columns.enabled = patch.enabled ? 1 : 0;
    if (patch.intervalMs != null) columns.interval_ms = CalendarService.clampInterval(patch.intervalMs);
    if (patch.config && typeof patch.config === 'object') columns.config = this._mergedConfig(current, patch.config);
    if (Object.keys(columns).length) this._sources.update(id, columns);
    this._emit('calendar.changed', { sourceId: id });
    return this.getSource(id);
  }

  removeSource(id) {
    const current = this._sources.get(id);
    if (!current) return false;
    this._events.deleteForSource(id);
    this._tokens.clear(id);
    this._secrets.delete(CalendarService.secretId(id));
    this._sources.delete(id);
    this._emit('calendar.changed', { sourceId: id, removed: true });
    return true;
  }

  listEvents({ from, to, days = CalendarService.DEFAULT_DAYS, sourceIds = null } = {}) {
    const fromMs = from ? Date.parse(from) : CalendarService._startOfToday(this._now());
    const toMs = to ? Date.parse(to) : fromMs + Math.max(1, parseInt(days, 10) || CalendarService.DEFAULT_DAYS) * 24 * 60 * 60 * 1000;
    const bySource = new Map(this._sources.list().map((s) => [s.id, s]));
    const ids = Array.isArray(sourceIds) && sourceIds.length ? sourceIds : null;
    return this._events.listBetween(new Date(fromMs).toISOString(), new Date(toMs).toISOString(), { sourceIds: ids })
      .map((event) => {
        const source = bySource.get(event.sourceId);
        return { ...event, sourceLabel: source ? source.label : '', sourceColor: source ? source.color : '', sourceKind: source ? source.kind : '' };
      });
  }

  async syncSource(source) {
    const row = typeof source === 'string' ? this._sources.get(source) : source;
    if (!row) return { sourceId: String(source), status: 'error', count: 0, error: 'calendar not found' };
    const result = await this._fetchAndStore(row);
    const nowMs = this._now();
    this._sources.recordSync(row.id, {
      status: result.status, error: result.error || null,
      lastSyncAt: new Date(nowMs).toISOString(), nextSyncAt: new Date(nowMs + (row.intervalMs || CalendarService.DEFAULT_INTERVAL_MS)).toISOString(),
    });
    this._emit('calendar.synced', { sourceId: row.id, status: result.status, count: result.count, error: result.error || null });
    return result;
  }

  startOAuth(sourceId) {
    const source = this._sources.get(sourceId);
    if (!source) return { success: false, error: 'calendar not found' };
    const provider = this._providers[source.kind];
    if (!provider || !provider.needsOAuth()) return { success: false, error: 'This calendar does not use a sign-in.' };
    try {
      const { url } = this._oauth.begin({
        sourceId, kind: source.kind, config: source.config, clientId: source.config.clientId,
        clientSecret: this._secrets.get(CalendarService.secretId(sourceId)) || '', redirectUri: this._getRedirectUri(),
      });
      return { success: true, url };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async completeOAuth(state, code, error) {
    const result = await this._oauth.complete({ state, code, error });
    if (result.success) {
      const source = this._sources.get(result.sourceId);
      if (source) {
        this._sources.recordSync(source.id, { status: 'connected', error: null, lastSyncAt: source.lastSyncAt, nextSyncAt: new Date(this._now()).toISOString() });
        this._emit('calendar.changed', { sourceId: source.id, connected: true });
      }
    }
    return result;
  }

  describeSources() {
    return this.listSources().map((s) => `${s.label} (${s.kind}${s.connected ? '' : ', not signed in'}, ${s.eventCount} events)`).join('; ');
  }

  async _fetchAndStore(row) {
    try {
      const provider = this._provider(row.kind);
      const credentials = provider.needsOAuth() ? { accessToken: await this._accessToken(row) } : null;
      const nowMs = this._now();
      const from = new Date(nowMs - CalendarService.WINDOW_PAST_MS).toISOString();
      const to = new Date(nowMs + CalendarService.WINDOW_FUTURE_MS).toISOString();
      const events = await provider.fetchEvents(row, { from, to, credentials, fetchImpl: this._fetch });
      const count = this._events.replaceForSource(row.id, events);
      return { sourceId: row.id, status: 'ok', count };
    } catch (err) {
      return { sourceId: row.id, status: 'error', count: 0, error: (err && err.message) || String(err) };
    }
  }

  _accessToken(row) {
    const endpoints = OAuthProviders.for(row.kind, row.config) || {};
    return this._tokens.accessToken(row.id, {
      tokenUrl: endpoints.tokenUrl, clientId: row.config.clientId,
      clientSecret: this._secrets.get(CalendarService.secretId(row.id)) || '', label: row.label, fetchImpl: this._fetch,
    });
  }

  _provider(kind) {
    const provider = this._providers[kind];
    if (!provider) throw new Error(`Unknown calendar kind "${kind}"`);
    return provider;
  }

  _mergedConfig(current, patchConfig) {
    const { clean, clientSecret } = CalendarService._splitSecret({ ...(current.config || {}), ...patchConfig });
    const problem = this._provider(current.kind).validateConfig(clean);
    if (problem) throw new Error(problem);
    if (clientSecret) this._secrets.set(CalendarService.secretId(current.id), clientSecret);
    return clean;
  }

  _present(source) {
    const provider = this._providers[source.kind];
    const { clean } = CalendarService._splitSecret(source.config);
    return {
      ...source,
      config: clean,
      connected: provider && provider.needsOAuth() ? this._tokens.isConnected(source.id) : true,
      hasClientSecret: !!this._secrets.has(CalendarService.secretId(source.id)),
      eventCount: this._events.countForSource(source.id),
    };
  }

  static _splitSecret(config) {
    const clean = { ...(config || {}) };
    const clientSecret = clean.clientSecret ? String(clean.clientSecret) : '';
    delete clean.clientSecret;
    return { clean, clientSecret };
  }

  static _startOfToday(nowMs) {
    const d = new Date(nowMs);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }
}

module.exports = CalendarService;
