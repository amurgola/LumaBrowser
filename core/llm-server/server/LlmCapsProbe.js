const axios = require('axios');
const ThinkingProbe = require('./ThinkingProbe');
const ThinkingFacts = require('./ThinkingFacts');
const ReasoningEffort = require('../../shared/llm/ReasoningEffort');

class LlmCapsProbe {
  static PROPS_TIMEOUT_MS = 3000;

  constructor({ baseUrl, authKey = null, modelPath = null, recallProbe = null, logTag = '[llm-server]' }) {
    this._baseUrl = baseUrl;
    this._headers = authKey ? { Authorization: `Bearer ${authKey}` } : undefined;
    this._modelPath = modelPath;
    this._recallProbe = recallProbe;
    this._logTag = logTag;
  }

  static emptyCaps() {
    return { reasoningEffort: null, reasoningDial: ReasoningEffort.DIAL_POSITIONS, thinking: null };
  }

  async execute() {
    const caps = LlmCapsProbe.emptyCaps();
    try {
      const template = await this._readTemplate();
      if (template) Object.assign(caps, LlmCapsProbe._capsFor(template, await this._thinkingFacts(template)));
    } catch (_) {}
    return caps;
  }

  async _readTemplate() {
    const res = await axios.get(`${this._baseUrl}/props`, { timeout: LlmCapsProbe.PROPS_TIMEOUT_MS, headers: this._headers });
    const data = res && res.data;
    const template = data && (data.chat_template
      || (data.default_generation_settings && data.default_generation_settings.chat_template));
    return typeof template === 'string' && template.length > 0 ? template : null;
  }

  async _thinkingFacts(template) {
    const cached = this._recall(ThinkingProbe.templateHashOf(template));
    if (cached) return cached;
    const facts = await ThinkingProbe.probe({ post: (body) => this._applyTemplate(body), template });
    this._logProbe(facts);
    return facts;
  }

  _recall(hash) {
    if (typeof this._recallProbe !== 'function') return null;
    try { return this._recallProbe(this._modelPath, hash) || null; } catch (_) { return null; }
  }

  _applyTemplate(body) {
    return axios.post(`${this._baseUrl}/apply-template`, body, {
      timeout: ThinkingProbe.REQUEST_TIMEOUT_MS, headers: this._headers, validateStatus: () => true,
    }).then((r) => ({ status: r.status, data: r.data }));
  }

  static _capsFor(template, thinking) {
    return {
      thinking,
      reasoningEffort: thinking.source === 'probe'
        ? ThinkingFacts.offersControl(thinking)
        : /reasoning_effort/.test(template),
      reasoningDial: ReasoningEffort.dialPositionsFor(thinking),
    };
  }

  _logProbe(facts) {
    const n = facts.requests || 0;
    console.log(`${this._logTag} thinking probe: ${facts.source}${n ? ` (${n} renders)` : ''}`
      + ` toggle=${facts.supportsThinkingToggle} default=${facts.thinkingDefault}`
      + ` levels=[${(facts.effortLevels || []).join(',')}] domain=${facts.effortDomain}`);
  }
}

module.exports = LlmCapsProbe;
