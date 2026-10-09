const TokenEstimator = require('../../shared/text/TokenEstimator');
const ContextBudget = require('../../shared/llm/ContextBudget');
const SummaryDirective = require('./compaction/SummaryDirective');
const TurnBoundary = require('./compaction/TurnBoundary');
const MessageText = require('./compaction/MessageText');

class Compaction {
  static SUMMARY_MARKER = SummaryDirective.MARKER;
  static SUMMARY_DIRECTIVE = SummaryDirective.TEXT;
  static MIN_HEAD_MESSAGES = 4;
  static ROLE_OVERHEAD_CHARS = 8;
  static MIN_CHARS_PER_TOKEN = 1.5;
  static MAX_CHARS_PER_TOKEN = 8;

  constructor(opts = {}) {
    this.reserveFraction = Compaction._fractionOr(opts.reserveFraction, ContextBudget.SHARES.compactionReserve);
    this.keepFraction = Compaction._fractionOr(opts.keepFraction, ContextBudget.SHARES.compactionKeep);
    this.charsPerToken = TokenEstimator.CHARS_PER_TOKEN;
    this.calibrate(opts.charsPerToken);
  }

  calibrate(charsPerToken) {
    const ratio = Number(charsPerToken);
    if (Number.isFinite(ratio) && ratio > 0) {
      this.charsPerToken = Math.min(Compaction.MAX_CHARS_PER_TOKEN, Math.max(Compaction.MIN_CHARS_PER_TOKEN, ratio));
    }
    return this.charsPerToken;
  }

  estimateTokens(messages) {
    let chars = 0;
    for (const message of messages || []) chars += this._messageChars(message);
    return Math.ceil(chars / this.charsPerToken);
  }

  shouldCompact(messages, contextWindow) {
    if (!Compaction._hasEnoughHistory(messages, contextWindow)) return false;
    return this.estimateTokens(messages) > contextWindow * (1 - this.reserveFraction);
  }

  findCutIndex(messages, contextWindow, boundary = 'turn', keepTokensOverride = null) {
    const keepTokens = keepTokensOverride > 0 ? keepTokensOverride : contextWindow * this.keepFraction;
    let cut = this._indexKeepingTokens(messages, keepTokens);
    if (cut === 0) return 0;
    while (cut > 0 && !TurnBoundary.isCutPoint(messages, cut, boundary)) cut--;
    return cut < Compaction.MIN_HEAD_MESSAGES ? 0 : cut;
  }

  async compact(messages, opts = {}) {
    const unchanged = { compacted: false, messages };
    if (!this._mayCompact(messages, opts)) return unchanged;
    const plan = this._planCut(messages, opts);
    if (!plan) return unchanged;
    const summary = await this._summarize(plan, opts.summarize);
    if (!summary) return unchanged;
    const framed = { role: 'user', content: SummaryDirective.wrap(summary) };
    if (!this._shrinks(framed, plan.head)) return unchanged;
    return Compaction._compactedResult(plan, framed, summary);
  }

  buildSummaryPrompt(head, opts = {}) {
    const system = (opts && Array.isArray(opts.system)) ? opts.system : [];
    return [
      ...system,
      ...(Array.isArray(head) ? head : []),
      { role: 'user', content: SummaryDirective.TEXT },
    ];
  }

  _mayCompact(messages, opts) {
    if (typeof opts.summarize !== 'function') return false;
    if (opts.force) return Compaction._hasEnoughHistory(messages, opts.contextWindow);
    return this.shouldCompact(messages, opts.contextWindow);
  }

  _planCut(messages, opts) {
    const boundary = opts.boundary === 'step' ? 'step' : 'turn';
    const lead = Compaction._leadingSystemCount(messages);
    const leading = messages.slice(0, lead);
    const rest = messages.slice(lead);
    const cut = this.findCutIndex(rest, opts.contextWindow, boundary, this._forcedKeepTokens(rest, opts));
    if (cut <= 0) return null;
    const headAll = rest.slice(0, cut);
    const head = headAll.filter((m) => !m || m.role !== 'system');
    if (head.length === 0) return null;
    return { leading, lead, cut, headAll, head, headSystem: headAll.filter((m) => m && m.role === 'system'), recent: rest.slice(cut) };
  }

  _forcedKeepTokens(rest, opts) {
    if (!opts.force) return null;
    return Math.min(opts.contextWindow * this.keepFraction, this.estimateTokens(rest) * this.keepFraction);
  }

  async _summarize(plan, summarize) {
    try {
      const text = await summarize(this.buildSummaryPrompt(plan.headAll, { system: plan.leading }));
      return text && String(text).trim() ? String(text).trim() : null;
    } catch (_) {
      return null;
    }
  }

  _shrinks(framed, head) {
    return this.estimateTokens([framed]) < this.estimateTokens(head);
  }

  _indexKeepingTokens(messages, keepTokens) {
    let acc = 0;
    for (let i = messages.length - 1; i >= 1; i--) {
      acc += Math.ceil(this._messageChars(messages[i]) / this.charsPerToken);
      if (acc >= keepTokens) return i;
    }
    return 0;
  }

  _messageChars(message) {
    return MessageText.of(message).length + Compaction.ROLE_OVERHEAD_CHARS;
  }

  static _compactedResult(plan, framed, summary) {
    return {
      compacted: true,
      summary,
      removed: plan.head.length,
      keptFrom: plan.lead + plan.cut,
      prefixLength: plan.leading.length + plan.headSystem.length + 1,
      messages: [...plan.leading, ...plan.headSystem, framed, ...plan.recent],
    };
  }

  static _hasEnoughHistory(messages, contextWindow) {
    return Array.isArray(messages) && messages.length > Compaction.MIN_HEAD_MESSAGES && contextWindow > 0;
  }

  static _leadingSystemCount(messages) {
    let lead = 0;
    while (lead < messages.length && messages[lead] && messages[lead].role === 'system') lead++;
    return lead;
  }

  static _fractionOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 && n < 1 ? n : fallback;
  }
}

module.exports = Compaction;
