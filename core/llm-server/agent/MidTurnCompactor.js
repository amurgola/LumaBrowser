const Compaction = require('../chat/Compaction');
const ContextBudget = require('../../shared/llm/ContextBudget');
const TokenEstimator = require('../../shared/text/TokenEstimator');

class MidTurnCompactor {
  static MAX_PER_RUN = 4;
  static SETTING = 'core.llmServer.chat.compaction';
  static MIN_CHARS_PER_TOKEN = 1.5;
  static MAX_CHARS_PER_TOKEN = 8;
  static PER_MESSAGE_TOKENS = 3;

  static isEnabled(ctxPerSlot, db) {
    if (!(ctxPerSlot > 0)) return false;
    if (!db || typeof db.get !== 'function') return true;
    return db.get(MidTurnCompactor.SETTING, true) !== false;
  }

  constructor(options) {
    this._compaction = options.enabled ? new Compaction() : null;
    this._ctxPerSlot = options.ctxPerSlot;
    this._nativeToolsTokens = Number(options.nativeToolsTokens) || 0;
    this._history = options.history;
    this._sender = options.sender;
    this._steps = options.steps;
    this._emit = options.emit;
    this._shouldAbort = options.shouldAbort;
    this._charsPerToken = TokenEstimator.CHARS_PER_TOKEN;
    this._count = 0;
  }

  get count() {
    return this._count;
  }

  get enabled() {
    return !!this._compaction;
  }

  calibrate(chars, tokens) {
    if (!(chars > 0) || !(tokens > 0)) return;
    this._charsPerToken = Math.min(MidTurnCompactor.MAX_CHARS_PER_TOKEN, Math.max(MidTurnCompactor.MIN_CHARS_PER_TOKEN, chars / tokens));
    if (this._compaction) this._compaction.calibrate(this._charsPerToken);
  }

  async compactIfOverTrigger(iteration) {
    if (!this._compaction) return 0;
    const trigger = ContextBudget.resolveBudget({ ctxPerSlot: this._ctxPerSlot, fixedTokens: this._history.fixedTokens() }).compactionTriggerTokens;
    if (this._estimateRequestTokens() <= trigger) return 0;
    return this.compact(iteration, 'proactive', false);
  }

  async compact(iteration, reason, force) {
    if (!this._mayRun()) return 0;
    const before = this._history.chars();
    this._emit({ type: 'compacting', reason });
    const result = await this._summarize(force);
    if (!result || !result.compacted) {
      this._steps.push({ iteration, compaction: { reason, compacted: false } });
      return 0;
    }
    return this._apply(iteration, reason, result, before);
  }

  _mayRun() {
    if (!this._compaction || this._count >= MidTurnCompactor.MAX_PER_RUN) return false;
    return !(typeof this._shouldAbort === 'function' && this._shouldAbort());
  }

  async _summarize(force) {
    try {
      return await this._compaction.compact(this._history.messages, {
        contextWindow: this._ctxPerSlot,
        boundary: 'step',
        force: !!force,
        summarize: (promptMessages) => this._sender.summarize(promptMessages),
      });
    } catch (_) {
      return null;
    }
  }

  _apply(iteration, reason, result, before) {
    this._history.applyCompaction(result);
    this._count += 1;
    const freed = before - this._history.chars();
    this._steps.push({ iteration, compaction: { reason, compacted: true, removed: result.removed, freedChars: freed } });
    this._emit({ type: 'compacted', reason, removed: result.removed, contextWindow: this._ctxPerSlot, freedChars: freed });
    return freed;
  }

  _estimateRequestTokens() {
    const messages = this._history.messages;
    return Math.ceil(this._history.chars() / this._charsPerToken)
      + messages.length * MidTurnCompactor.PER_MESSAGE_TOKENS + this._nativeToolsTokens;
  }
}

module.exports = MidTurnCompactor;
