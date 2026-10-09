const ThinkingVocabulary = require('./ThinkingVocabulary');

class ThinkingFactsDeriver {
  constructor(renders, { nonce, invalid, templateHash = null } = {}) {
    this._renders = renders || {};
    this._nonce = nonce;
    this._invalid = invalid || [];
    this._templateHash = templateHash;
  }

  execute() {
    this._resolveBaselines();
    if (!this._base.user) return null;
    this._resolveToggle();
    this._resolveEffortDomain();
    this._resolveAcceptedLevels();
    this._collapseAliases();
    this._resolveEffortSummary();
    this._resolveThinkingDefault();
    return this._buildFacts();
  }

  _resolveBaselines() {
    this._base = {};
    for (const s of ThinkingVocabulary.SHAPES) this._base[s] = this._get(`base:${s}`);
    this._shapes = {};
    for (const s of Object.keys(this._base)) this._shapes[s] = this._base[s] !== null;
  }

  _resolveToggle() {
    const generation = ['user', 'system', 'tools'].some((s) => this._differs(`off:${s}`, s)) || this._differs('on:user', 'user');
    const history = this._differs('off:history', 'history') || this._differs('on:history', 'history');
    this._supportsThinkingToggle = generation;
    this._toggleAffectsHistoryOnly = !generation && history;
  }

  _resolveEffortDomain() {
    const kinds = this._invalid.map((v) => this._classifyInvalid(v));
    this._invalidPassesThrough = kinds.some((k) => k.kind === 'passthrough');
    this._effortDomain = ThinkingFactsDeriver._domainFrom(kinds, this._invalidPassesThrough);
    this._fallbackPrompts = new Set(kinds.filter((k) => k.kind === 'fallback').map((k) => k.prompt));
  }

  _classifyInvalid(value) {
    const r = this._renders[`invalid:${value}:user`];
    if (!r || !r.ok || typeof r.prompt !== 'string') return { kind: 'rejected' };
    if (r.prompt === this._base.user) return { kind: 'ignored' };
    if (r.prompt.includes(value)) return { kind: 'passthrough' };
    return { kind: 'fallback', prompt: r.prompt };
  }

  static _domainFrom(kinds, passesThrough) {
    if (passesThrough) return 'open';
    if (kinds.every((k) => k.kind === 'rejected')) return 'closed';
    if (kinds.some((k) => k.kind === 'fallback')) return 'shared-fallback';
    return 'ignored';
  }

  _resolveAcceptedLevels() {
    this._accepted = [];
    for (const level of ThinkingVocabulary.EFFORT_ORDER) {
      const prompt = this._get(`effort:${level}:user`);
      if (prompt !== null && this._isEvidence(level, prompt)) this._accepted.push({ level, prompt });
    }
  }

  _isEvidence(level, prompt) {
    if (this._effortDomain === 'open') return ThinkingVocabulary.PASSTHROUGH_DOMAIN.includes(level);
    if (this._effortDomain === 'closed') return true;
    if (prompt !== this._base.user && !this._fallbackPrompts.has(prompt)) return true;
    return prompt === this._base.user && level !== 'none' && ThinkingFactsDeriver._nameEvidence(level, prompt);
  }

  _collapseAliases() {
    const groups = new Map();
    for (const a of this._accepted) {
      if (!groups.has(a.prompt)) groups.set(a.prompt, []);
      groups.get(a.prompt).push(a.level);
    }
    this._effortAliases = {};
    this._representatives = [];
    for (const [prompt, levels] of groups) {
      const rep = ThinkingFactsDeriver._representativeOf(levels, prompt);
      this._representatives.push({ level: rep, prompt });
      for (const lv of levels) if (lv !== rep) this._effortAliases[lv] = rep;
    }
  }

  static _representativeOf(levels, prompt) {
    const named = levels.filter((lv) => ThinkingFactsDeriver._nameEvidence(lv, prompt));
    const pool = named.length ? named : levels;
    const rank = (lv) => ThinkingVocabulary.EFFORT_ORDER.indexOf(lv);
    return pool.reduce((best, lv) => (rank(lv) > rank(best) ? lv : best), pool[0]);
  }

  _resolveEffortSummary() {
    const rank = (lv) => ThinkingVocabulary.EFFORT_ORDER.indexOf(lv);
    this._noneAccepted = this._representatives.some((r) => r.level === 'none');
    this._effortLevels = this._representatives.map((r) => r.level)
      .filter((lv) => lv !== 'none')
      .sort((a, b) => rank(a) - rank(b));
    const defaultHit = this._representatives.find((r) => r.level !== 'none' && r.prompt === this._base.user);
    this._effortDefault = defaultHit ? defaultHit.level : null;
    this._effortAffectsHistoryOnly = this._effortLevels.length === 0
      && ['low', 'high'].some((lv) => this._differs(`effort:${lv}:history`, 'history'));
  }

  _resolveThinkingDefault() {
    this._thinkingDefault = this._thinkingDefaultValue();
    this._thinkingFixed = this._thinkingDefault === 'fixed-on';
    this._disableKwarg = this._disableKwargValue();
  }

  _thinkingDefaultValue() {
    if (this._supportsThinkingToggle) return this._toggleDefault();
    if (this._noneAccepted) return 'on';
    if (this._opensThinking()) return 'fixed-on';
    return this._effortLevels.length ? 'on' : 'none';
  }

  _toggleDefault() {
    const on = this._get('on:user');
    const off = this._get('off:user');
    if (on !== null && on === this._base.user) return 'on';
    if (off !== null && off === this._base.user) return 'off';
    return 'on';
  }

  _opensThinking() {
    const i = this._base.user.lastIndexOf(this._nonce);
    const tail = i < 0 ? this._base.user : this._base.user.slice(i + this._nonce.length);
    return ThinkingVocabulary.THINK_OPEN_MARKERS.some((m) => tail.includes(m));
  }

  _disableKwargValue() {
    if (this._supportsThinkingToggle) return { enable_thinking: false };
    if (this._noneAccepted) return { reasoning_effort: 'none' };
    return null;
  }

  _buildFacts() {
    return {
      source: 'probe',
      probeVersion: ThinkingVocabulary.PROBE_VERSION,
      templateHash: this._templateHash,
      supportsThinkingToggle: this._supportsThinkingToggle,
      toggleAffectsHistoryOnly: this._toggleAffectsHistoryOnly,
      thinkingDefault: this._thinkingDefault,
      thinkingFixed: this._thinkingFixed,
      effortLevels: this._effortLevels,
      effortDefault: this._effortDefault,
      effortDomain: this._effortDomain,
      effortAliases: this._effortAliases,
      invalidPassesThrough: this._invalidPassesThrough,
      effortAffectsHistoryOnly: this._effortAffectsHistoryOnly,
      disableKwarg: this._disableKwarg,
      shapes: this._shapes,
    };
  }

  _get(key) {
    const r = this._renders[key];
    if (!r || !r.ok || typeof r.prompt !== 'string') return null;
    return r.prompt.includes(this._nonce) ? r.prompt : null;
  }

  _differs(key, shape) {
    const r = this._get(key);
    return r !== null && this._base[shape] !== null && r !== this._base[shape];
  }

  static _nameEvidence(level, text) {
    const spellings = ThinkingVocabulary.EFFORT_SPELLINGS[level] || [level];
    return spellings.some((sp) => ThinkingFactsDeriver._hasBoundedTerm(text, sp));
  }

  static _hasBoundedTerm(text, term) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9_])${escaped}([^a-z0-9_]|$)`, 'i').test(text);
  }
}

module.exports = ThinkingFactsDeriver;
