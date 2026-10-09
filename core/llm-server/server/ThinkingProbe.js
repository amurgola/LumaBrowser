const crypto = require('crypto');
const ThinkingFacts = require('./ThinkingFacts');
const ThinkingProbePlan = require('./ThinkingProbePlan');

class ThinkingProbe {
  static MAX_REQUESTS = 22;
  static REQUEST_TIMEOUT_MS = 3000;
  static TOTAL_TIMEOUT_MS = 15000;
  static CONCURRENCY = 4;

  constructor({ post, template = null, timeoutMs = ThinkingProbe.TOTAL_TIMEOUT_MS } = {}) {
    this._post = post;
    this._template = template;
    this._timeoutMs = timeoutMs;
  }

  static probe(options) {
    return new ThinkingProbe(options).execute();
  }

  static templateHashOf(template) {
    return crypto.createHash('sha256').update(String(template || '')).digest('hex').slice(0, 16);
  }

  async execute() {
    this._setupProbeState();
    if (typeof this._post !== 'function') return this._fallback();
    if (!(await this._renderBaseline())) return this._fallback();
    await this._renderRestOfPlan();
    const firstPass = this._derive();
    if (!firstPass) return this._fallback();
    await this._renderHistoryEffortIfNeeded(firstPass);
    return this._finalFacts();
  }

  _setupProbeState() {
    this._templateHash = this._template ? ThinkingProbe.templateHashOf(this._template) : null;
    this._nonce = 'NONCE_' + crypto.randomBytes(5).toString('hex');
    this._invalid = [ThinkingProbe._randomInvalid(), ThinkingProbe._randomInvalid()];
    this._shapes = ThinkingProbePlan.buildShapes(this._nonce);
    this._plan = ThinkingProbePlan.buildPlan(this._invalid).slice(0, ThinkingProbe.MAX_REQUESTS - 2);
    this._renders = {};
    this._deadline = Date.now() + this._timeoutMs;
  }

  async _renderBaseline() {
    const first = this._plan[0];
    await this._run(first);
    return !!(this._renders[first.key] && this._renders[first.key].ok);
  }

  async _renderRestOfPlan() {
    const rest = this._plan.slice(1);
    for (let i = 0; i < rest.length; i += ThinkingProbe.CONCURRENCY) {
      await Promise.all(rest.slice(i, i + ThinkingProbe.CONCURRENCY).map((e) => this._run(e)));
    }
  }

  async _renderHistoryEffortIfNeeded(firstPass) {
    if (firstPass.effortLevels.length !== 0 || !firstPass.shapes.history) return;
    await Promise.all(ThinkingProbePlan.historyEffortEntries().map((e) => this._run(e)));
  }

  _finalFacts() {
    const facts = this._derive();
    if (!facts) return this._fallback();
    facts.requests = Object.keys(this._renders).length;
    return facts;
  }

  async _run(entry) {
    if (Date.now() > this._deadline) { this._renders[entry.key] = { ok: false, status: 0 }; return; }
    try {
      const r = await this._post(ThinkingProbePlan.requestBody(this._shapes, entry));
      this._renders[entry.key] = ThinkingProbe._toRender(r);
    } catch (_) {
      this._renders[entry.key] = { ok: false, status: 0 };
    }
  }

  static _toRender(r) {
    const ok = r && r.status >= 200 && r.status < 300 && r.data && typeof r.data.prompt === 'string';
    return ok ? { ok: true, prompt: r.data.prompt } : { ok: false, status: r ? r.status : 0 };
  }

  _derive() {
    return ThinkingFacts.derive(this._renders, { nonce: this._nonce, invalid: this._invalid, templateHash: this._templateHash });
  }

  _fallback() {
    return ThinkingFacts.fromRegex(this._template, this._templateHash);
  }

  static _randomInvalid() {
    return 'zq' + crypto.randomBytes(4).toString('hex');
  }
}

module.exports = ThinkingProbe;
