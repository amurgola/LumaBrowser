const CharacterChronicle = require('../world/CharacterChronicle');
const CharacterProfile = require('../world/CharacterProfile');
const StoryLedger = require('../world/StoryLedger');
const ConsolidatePrompt = require('../prompts/ConsolidatePrompt');
const RpDebug = require('../images/RpDebug');

class ConsolidateCall {
  static TIMEOUT_MS = 90000;
  static TEMPERATURE = 0.2;

  constructor(chat, logger = null) {
    this._chat = chat;
    this._logger = logger;
  }

  static foldRequest(data, char, beats) {
    return {
      messages: ConsolidatePrompt.foldMessages(data, char, beats), temperature: ConsolidateCall.TEMPERATURE,
      timeoutMs: ConsolidateCall.TIMEOUT_MS, noThink: true, modelRef: data.llmModel || undefined,
    };
  }

  static summaryRequest(data, rows) {
    return {
      messages: ConsolidatePrompt.summaryMessages(data, rows), temperature: ConsolidateCall.TEMPERATURE,
      timeoutMs: ConsolidateCall.TIMEOUT_MS, noThink: true, modelRef: data.llmModel || undefined,
    };
  }

  static due(data) {
    const chars = Array.isArray(data.characters) ? data.characters : [];
    return StoryLedger.needsSummary(data) || chars.some((c) => c && CharacterChronicle.needsFold(c));
  }

  async run(data) {
    if (typeof this._chat.complete !== 'function') return false;
    let changed = false;
    const chars = Array.isArray(data.characters) ? data.characters : [];
    const toFold = chars.find((c) => c && c.name && CharacterChronicle.needsFold(c));
    if (toFold && await this._fold(data, toFold)) changed = true;
    if (StoryLedger.needsSummary(data) && await this._summary(data)) changed = true;
    return changed;
  }

  async _fold(data, char) {
    const beats = CharacterChronicle.foldable(char);
    if (!beats.length) return false;
    const started = Date.now();
    try {
      const r = await this._chat.complete(ConsolidateCall.foldRequest(data, char, beats));
      const fold = r && r.text ? ConsolidatePrompt.parseFold(r.text) : null;
      RpDebug.log('post.consolidate.fold', { ms: Date.now() - started, name: char.name, ok: !!fold, folded: beats.length });
      if (!fold) return false;
      CharacterChronicle.applyFold(char, fold.arc, beats.length);
      CharacterProfile.apply(char, { wants: fold.wants, hides: fold.hides, bondUser: fold.bondUser }, { growthOnly: true });
      return true;
    } catch (e) {
      RpDebug.log('post.consolidate.error', { ms: Date.now() - started, error: e && e.message });
      if (this._logger && this._logger.warn) this._logger.warn('roleplay fold call failed', { error: e && e.message });
      return false;
    }
  }

  async _summary(data) {
    const rows = StoryLedger.unsummarised(data);
    if (!rows.length) return false;
    const started = Date.now();
    try {
      const r = await this._chat.complete(ConsolidateCall.summaryRequest(data, rows));
      const text = r && r.text ? ConsolidatePrompt.parseSummary(r.text) : '';
      RpDebug.log('post.consolidate.summary', { ms: Date.now() - started, ok: !!text, rows: rows.length });
      return text ? StoryLedger.applySummary(data, text, StoryLedger.of(data).turn) : false;
    } catch (e) {
      RpDebug.log('post.consolidate.error', { ms: Date.now() - started, error: e && e.message });
      if (this._logger && this._logger.warn) this._logger.warn('roleplay summary call failed', { error: e && e.message });
      return false;
    }
  }
}

module.exports = ConsolidateCall;
