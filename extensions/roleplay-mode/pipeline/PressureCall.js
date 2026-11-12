const StoryLedger = require('../world/StoryLedger');
const PressurePrompt = require('../prompts/PressurePrompt');
const RpDebug = require('../images/RpDebug');

const SideModel = require('../mode/SideModel');
const ReactionScope = require('./ReactionScope');
class PressureCall {
  static TIMEOUT_MS = 60000;
  static TEMPERATURE = 0.3;

  constructor(chat, logger = null) {
    this._chat = chat;
    this._logger = logger;
  }

  static REFRESH_TURNS = 5;
  static FIRST_TURN = 4;

  static due(data) {
    const s = StoryLedger.of(data);
    if (s.turn < PressureCall.FIRST_TURN) return false;
    if (!s.pressureTurn) return true;
    return s.summaryTurn > s.pressureTurn || s.turn - s.pressureTurn >= PressureCall.REFRESH_TURNS;
  }

  static request(data, content) {
    return {
      messages: PressurePrompt.messages(data, content), temperature: PressureCall.TEMPERATURE,
      timeoutMs: PressureCall.TIMEOUT_MS, noThink: true, modelRef: SideModel.ref(data),
    };
  }

  async run(data, content) {
    if (typeof this._chat.complete !== 'function') return false;
    const started = Date.now();
    try {
      const r = await this._chat.complete(PressureCall.request(data, content));
      const out = r && r.text ? PressurePrompt.parse(r.text) : null;
      RpDebug.log('post.pressure', { ms: Date.now() - started, ok: !!out, error: r && r.error });
      if (!out) return false;
      if (out.pressure && (PressurePrompt.describesPassage(out.pressure, content) || !PressurePrompt.looksAhead(out.pressure))) out.pressure = '';
      const turn = StoryLedger.of(data).turn;
      let changed = false;
      if (StoryLedger.setPressure(data, out.pressure, turn)) changed = true;
      if (out.thread && StoryLedger.pinThread(data, out.thread, turn)) changed = true;
      return changed;
    } catch (e) {
      if (ReactionScope.isStop(e)) throw e;
      RpDebug.log('post.pressure.error', { ms: Date.now() - started, error: e && e.message });
      if (this._logger && this._logger.warn) this._logger.warn('roleplay pressure call failed', { error: e && e.message });
      return false;
    }
  }
}

module.exports = PressureCall;
