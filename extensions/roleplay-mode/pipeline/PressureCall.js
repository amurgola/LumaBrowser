const StoryLedger = require('../world/StoryLedger');
const PressurePrompt = require('../prompts/PressurePrompt');
const RpDebug = require('../images/RpDebug');

const SideModel = require('../mode/SideModel');
class PressureCall {
  static TIMEOUT_MS = 60000;
  static TEMPERATURE = 0.3;

  constructor(chat, logger = null) {
    this._chat = chat;
    this._logger = logger;
  }

  static due(data) {
    const s = StoryLedger.of(data);
    return !s.pressure || s.summaryTurn > s.pressureTurn;
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
      const turn = StoryLedger.of(data).turn;
      let changed = false;
      if (out.pressure && StoryLedger.setPressure(data, out.pressure, turn)) changed = true;
      if (out.thread && StoryLedger.pinThread(data, out.thread, turn)) changed = true;
      return changed;
    } catch (e) {
      RpDebug.log('post.pressure.error', { ms: Date.now() - started, error: e && e.message });
      if (this._logger && this._logger.warn) this._logger.warn('roleplay pressure call failed', { error: e && e.message });
      return false;
    }
  }
}

module.exports = PressureCall;
