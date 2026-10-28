const ProseSlop = require('../prompts/ProseSlop');
const ProsePolishPrompt = require('../prompts/ProsePolishPrompt');
const RpDebug = require('../images/RpDebug');

class ProsePolishCall {
  static TIMEOUT_MS = 90000;
  static TEMPERATURE = 0.5;
  static MAX_PARAGRAPHS = 4;

  constructor(chat, logger = null) {
    this._chat = chat;
    this._logger = logger;
  }

  static wanted(data) {
    return !!(data && data.options && data.options.prosePolish);
  }

  static request(data, content, flagged) {
    return {
      messages: ProsePolishPrompt.messages(content, flagged), temperature: ProsePolishCall.TEMPERATURE,
      timeoutMs: ProsePolishCall.TIMEOUT_MS, noThink: true, modelRef: data.llmModel || undefined,
    };
  }

  async run(data, content) {
    const score = ProseSlop.score(content);
    const flagged = ProseSlop.flaggedParagraphs(content).slice(0, ProsePolishCall.MAX_PARAGRAPHS);
    if (!flagged.length || typeof this._chat.complete !== 'function') return { content, changed: false, score };
    const started = Date.now();
    try {
      const r = await this._chat.complete(ProsePolishCall.request(data, content, flagged));
      const rewrites = r && r.text ? ProsePolishPrompt.parse(r.text) : null;
      const out = rewrites ? ProsePolishPrompt.splice(content, rewrites) : { content, changed: false };
      RpDebug.log('post.polish', { ms: Date.now() - started, flagged: flagged.length, changed: out.changed, perHundred: score.perHundred });
      return { content: out.content, changed: out.changed, score };
    } catch (e) {
      RpDebug.log('post.polish.error', { ms: Date.now() - started, error: e && e.message });
      if (this._logger && this._logger.warn) this._logger.warn('roleplay polish call failed', { error: e && e.message });
      return { content, changed: false, score };
    }
  }
}

module.exports = ProsePolishCall;
