const StagingPrompt = require('./StagingPrompt');
const StagingParser = require('./StagingParser');
const RpDebug = require('../images/RpDebug');

class StageCall {
  static TIMEOUT_MS = 90000;
  static TEMPERATURE = 0.2;

  constructor(chat, logger = null) {
    this._chat = chat;
    this._logger = logger;
  }

  static request(data, content) {
    return {
      messages: StagingPrompt.messages(data, content), temperature: StageCall.TEMPERATURE,
      timeoutMs: StageCall.TIMEOUT_MS, noThink: true, modelRef: data.llmModel || undefined,
    };
  }

  async run(data, content) {
    const started = Date.now();
    try {
      const r = await this._chat.complete(StageCall.request(data, content));
      RpDebug.log('post.stage.raw', {
        ms: Date.now() - started, hasText: !!(r && r.text), textLen: (r && r.text) ? r.text.length : 0,
        error: r && r.error, sample: (r && r.text) ? r.text.slice(0, 160) : null,
      });
      const ex = r && r.text ? StagingParser.parse(r.text) : null;
      StageCall._logParsed(ex);
      return ex;
    } catch (e) {
      RpDebug.log('post.stage.error', { ms: Date.now() - started, error: e && e.message });
      if (this._logger && this._logger.warn) this._logger.warn('roleplay stage call failed', { error: e && e.message });
      return null;
    }
  }

  static _logParsed(ex) {
    RpDebug.log('post.stage.parsed', {
      ok: !!ex,
      newChars: ex ? ex.characters.map((c) => c.name) : [],
      location: ex && ex.location ? (ex.location.name + (ex.location.isNew ? ' (new)' : '')) : null,
      stateChars: ex && ex.currentState
        ? (ex.currentState.characters || []).map((c) => c.name + (c.outfitChanged ? '*' : '') + (c.outfit ? ':' + c.outfit : ''))
        : [],
      shot: ex && ex.shot ? { pose: ex.shot.pose, framing: ex.shot.framing, focus: ex.shot.focus, contact: ex.shot.contact } : null,
    });
  }
}

module.exports = StageCall;
