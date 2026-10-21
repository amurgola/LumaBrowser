const RecordId = require('../../core/database/RecordId');
const JsonColumn = require('../../core/database/JsonColumn');
const EndpointSpec = require('./spec/EndpointSpec');

class SiteApiStore {
  static SITE_ID_PATTERN = /^[a-z][a-z0-9-]{0,39}$/;
  static RESULT_CAP = 200000;
  static RUNS_KEPT = 50;

  static DEFAULT_LOGIN = Object.freeze({ required: false, signInUrlPatterns: [], signedInSelector: null, signedOutSelector: null });

  constructor(db) {
    this._db = db;
  }


  listSites() {
    return this._db.query('SELECT * FROM site_api_sites ORDER BY name COLLATE NOCASE').map(SiteApiStore._site);
  }

  getSite(id) {
    const row = this._db.query('SELECT * FROM site_api_sites WHERE id = ?', id)[0];
    return row ? SiteApiStore._site(row) : null;
  }

  findSite({ partition, origin }) {
    const row = this._db.query('SELECT * FROM site_api_sites WHERE partition = ? AND origin = ?', partition, origin)[0];
    return row ? SiteApiStore._site(row) : null;
  }

  getSiteByConversation(conversationId) {
    if (!conversationId) return null;
    const row = this._db.query('SELECT * FROM site_api_sites WHERE conversation_id = ?', conversationId)[0];
    return row ? SiteApiStore._site(row) : null;
  }

  createSite(input) {
    const origin = SiteApiStore.originOf(input.origin || input.startUrl);
    if (!origin) throw new Error('A site needs a valid http(s) origin');
    const name = String(input.name || '').trim() || new URL(origin).hostname;
    const id = this._uniqueSiteId(input.id || SiteApiStore.slug(name));
    const now = SiteApiStore._now();
    this._db.run(
      'INSERT INTO site_api_sites (id, name, origin, partition, start_url, login, status, status_note, conversation_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id, name, origin, String(input.partition || 'persist:main'), String(input.startUrl || origin),
      JSON.stringify(SiteApiStore.normalizeLogin(input.login)), 'unknown', null, input.conversationId || null, now, now,
    );
    return this.getSite(id);
  }

  updateSite(id, patch = {}) {
    const columns = {};
    if (patch.name != null) columns.name = String(patch.name).trim();
    if (patch.startUrl != null) columns.start_url = String(patch.startUrl);
    if (patch.login !== undefined) columns.login = JSON.stringify(SiteApiStore.normalizeLogin(patch.login));
    if (patch.conversationId !== undefined) columns.conversation_id = patch.conversationId;
    if (patch.status != null) columns.status = String(patch.status);
    if (patch.statusNote !== undefined) columns.status_note = patch.statusNote;
    this._update('site_api_sites', id, columns);
    return this.getSite(id);
  }

  setSiteStatus(id, status, note = null) {
    return this.updateSite(id, { status, statusNote: note });
  }

  deleteSite(id) {
    this._db.run('DELETE FROM site_api_runs WHERE site_id = ?', id);
    this._db.run('DELETE FROM site_api_endpoints WHERE site_id = ?', id);
    return this._db.run('DELETE FROM site_api_sites WHERE id = ?', id).changes > 0;
  }


  listEndpoints(siteId = null) {
    const rows = siteId
      ? this._db.query('SELECT * FROM site_api_endpoints WHERE site_id = ? ORDER BY name', siteId)
      : this._db.query('SELECT * FROM site_api_endpoints ORDER BY site_id, name');
    return rows.map(SiteApiStore._endpoint);
  }

  getEndpoint(id) {
    const row = this._db.query('SELECT * FROM site_api_endpoints WHERE id = ?', id)[0];
    return row ? SiteApiStore._endpoint(row) : null;
  }

  getEndpointByName(siteId, name) {
    const row = this._db.query('SELECT * FROM site_api_endpoints WHERE site_id = ? AND name = ?', siteId, name)[0];
    return row ? SiteApiStore._endpoint(row) : null;
  }

  createEndpoint(input) {
    if (!this.getSite(input.siteId)) throw new Error(`Unknown site "${input.siteId}"`);
    const spec = EndpointSpec.normalize(input);
    if (this.getEndpointByName(input.siteId, spec.name)) throw new Error(`Site "${input.siteId}" already has an endpoint named "${spec.name}"`);
    const id = RecordId.create('sapi');
    const now = SiteApiStore._now();
    this._db.run(
      'INSERT INTO site_api_endpoints (id, site_id, name, description, params, steps, returns, policy, status, last_run, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id, input.siteId, spec.name, spec.description, JSON.stringify(spec.params), JSON.stringify(spec.steps),
      JSON.stringify(spec.returns), JSON.stringify(spec.policy), SiteApiStore._status(input.status), null, now, now,
    );
    return this.getEndpoint(id);
  }

  updateEndpoint(id, patch = {}) {
    const current = this.getEndpoint(id);
    if (!current) throw new Error(`Unknown endpoint "${id}"`);
    const merged = EndpointSpec.normalize({ ...current, ...patch });
    if (merged.name !== current.name && this.getEndpointByName(current.siteId, merged.name)) {
      throw new Error(`Site "${current.siteId}" already has an endpoint named "${merged.name}"`);
    }
    const columns = {
      name: merged.name,
      description: merged.description,
      params: JSON.stringify(merged.params),
      steps: JSON.stringify(merged.steps),
      returns: JSON.stringify(merged.returns),
      policy: JSON.stringify(merged.policy),
    };
    if (patch.status != null) columns.status = SiteApiStore._status(patch.status);
    this._update('site_api_endpoints', id, columns);
    return this.getEndpoint(id);
  }

  setEndpointStatus(id, status) {
    this._update('site_api_endpoints', id, { status: SiteApiStore._status(status) });
    return this.getEndpoint(id);
  }

  deleteEndpoint(id) {
    this._db.run('DELETE FROM site_api_runs WHERE endpoint_id = ?', id);
    return this._db.run('DELETE FROM site_api_endpoints WHERE id = ?', id).changes > 0;
  }


  startRun({ endpointId, siteId, kind = 'call', params = {} }) {
    const id = RecordId.create('srun');
    this._db.run(
      'INSERT INTO site_api_runs (id, endpoint_id, site_id, kind, params, status, started_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id, endpointId, siteId, kind, JSON.stringify(params || {}), 'running', SiteApiStore._now(),
    );
    return id;
  }

  finishRun(id, { ok, fault = null, result = null, stepsLog = null, durationMs = null }) {
    const run = this.getRun(id);
    if (!run) return null;
    const finishedAt = SiteApiStore._now();
    this._db.run(
      'UPDATE site_api_runs SET status = ?, fault = ?, result = ?, steps_log = ?, duration_ms = ?, finished_at = ? WHERE id = ?',
      ok ? 'ok' : 'failed', fault ? JSON.stringify(fault) : null, SiteApiStore._capJson(result),
      stepsLog ? JSON.stringify(stepsLog) : null, durationMs, finishedAt, id,
    );
    this._update('site_api_endpoints', run.endpointId, {
      last_run: JSON.stringify({ runId: id, at: finishedAt, ok: !!ok, kind: run.kind, fault: fault ? { code: fault.code, message: fault.message } : null, durationMs }),
    });
    this._pruneRuns(run.endpointId);
    return this.getRun(id);
  }

  getRun(id) {
    const row = this._db.query('SELECT * FROM site_api_runs WHERE id = ?', id)[0];
    return row ? SiteApiStore._run(row) : null;
  }

  listRuns(endpointId, limit = 20) {
    return this._db.query('SELECT * FROM site_api_runs WHERE endpoint_id = ? ORDER BY started_at DESC LIMIT ?', endpointId, limit).map(SiteApiStore._run);
  }


  static normalizeLogin(login) {
    const given = login && typeof login === 'object' ? login : {};
    return {
      required: !!given.required,
      signInUrlPatterns: Array.isArray(given.signInUrlPatterns) ? given.signInUrlPatterns.map(String).filter(Boolean) : [],
      signedInSelector: given.signedInSelector ? String(given.signedInSelector) : null,
      signedOutSelector: given.signedOutSelector ? String(given.signedOutSelector) : null,
    };
  }

  static originOf(url) {
    try {
      const parsed = new URL(String(url || ''));
      return /^https?:$/.test(parsed.protocol) ? parsed.origin : null;
    } catch (_) {
      return null;
    }
  }

  static slug(text) {
    const slug = String(text || '').toLowerCase().replace(/^www\./, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return /^[a-z]/.test(slug) ? slug : `site-${slug}`.replace(/-+$/, '');
  }

  _uniqueSiteId(base) {
    const root = SiteApiStore.SITE_ID_PATTERN.test(base) ? base : SiteApiStore.slug(base);
    let candidate = root;
    for (let n = 2; this.getSite(candidate); n += 1) candidate = `${root.slice(0, 36)}-${n}`;
    return candidate;
  }

  _update(table, id, columns) {
    const names = Object.keys(columns);
    if (!names.length) return;
    names.push('updated_at');
    const values = [...Object.values(columns), SiteApiStore._now()];
    if (table === 'site_api_runs') { names.pop(); values.pop(); }
    this._db.run(`UPDATE ${table} SET ${names.map((n) => `${n} = ?`).join(', ')} WHERE id = ?`, ...values, id);
  }

  _pruneRuns(endpointId) {
    this._db.run(
      'DELETE FROM site_api_runs WHERE endpoint_id = ? AND id NOT IN (SELECT id FROM site_api_runs WHERE endpoint_id = ? ORDER BY started_at DESC LIMIT ?)',
      endpointId, endpointId, SiteApiStore.RUNS_KEPT,
    );
  }

  static _status(status) {
    return EndpointSpec.STATUSES.includes(status) ? status : 'draft';
  }

  static _capJson(value) {
    if (value === null || value === undefined) return null;
    const text = JSON.stringify(value);
    if (text.length <= SiteApiStore.RESULT_CAP) return text;
    return JSON.stringify({ truncated: true, preview: text.slice(0, SiteApiStore.RESULT_CAP) });
  }

  static _now() {
    return new Date().toISOString();
  }

  static _site(row) {
    return {
      id: row.id,
      name: row.name,
      origin: row.origin,
      partition: row.partition,
      startUrl: row.start_url,
      login: SiteApiStore.normalizeLogin(JsonColumn.parse(row.login, {})),
      status: row.status || 'unknown',
      statusNote: row.status_note || null,
      conversationId: row.conversation_id || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static _endpoint(row) {
    return {
      id: row.id,
      siteId: row.site_id,
      name: row.name,
      description: row.description || '',
      params: JsonColumn.parse(row.params, []),
      steps: JsonColumn.parse(row.steps, []),
      returns: JsonColumn.parse(row.returns, {}),
      policy: JsonColumn.parse(row.policy, {}),
      status: row.status || 'draft',
      lastRun: row.last_run ? JsonColumn.parse(row.last_run, null) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static _run(row) {
    return {
      id: row.id,
      endpointId: row.endpoint_id,
      siteId: row.site_id,
      kind: row.kind,
      params: JsonColumn.parse(row.params, {}),
      status: row.status,
      fault: row.fault ? JsonColumn.parse(row.fault, null) : null,
      result: row.result ? JsonColumn.parse(row.result, null) : null,
      stepsLog: row.steps_log ? JsonColumn.parse(row.steps_log, []) : [],
      durationMs: row.duration_ms,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
    };
  }
}

module.exports = SiteApiStore;
