const CoreRequire = require('../CoreRequire');
const LabTextScenario = require('./LabTextScenario');
const ConsistencyProbe = require('./ConsistencyProbe');
const ProseScore = require('./ProseScore');
const ProseJudge = require('./ProseJudge');

class LabTextRun {
  static TURN_TIMEOUT_MS = 300000;
  static CONTEXT_WINDOW = 16384;

  constructor({ mode, complete, Harness = null, emit = () => {}, ModeTurnMessages = null } = {}) {
    this._mode = mode;
    this._complete = complete;
    this._Harness = Harness;
    this._emit = emit;
    this._shape = ModeTurnMessages || LabTextRun._coreShaper();
    this._active = null;
  }

  async run(options = {}) {
    const scenario = options.scenario || LabTextScenario.build();
    const meta = { mode: 'roleplay', data: JSON.parse(JSON.stringify(scenario.data)) };
    const turns = scenario.turns.slice(0, options.turns > 0 ? options.turns : scenario.turns.length);
    this._active = this._harness(options);
    const harness = this._active;
    const transcript = [];
    let error = null;
    try {
      const history = [];
      for (let i = 0; i < turns.length; i += 1) {
        const entry = await this._turn(meta, history, turns[i], i + 1);
        transcript.push(entry);
        this._emit('lab:text', { phase: 'turn', turn: i + 1, of: turns.length, user: entry.user, assistant: entry.assistant });
      }
    } catch (e) {
      error = (e && e.message) || String(e);
    } finally {
      if (harness) this._Harness.uninstall();
      this._active = null;
    }
    const probe = ConsistencyProbe.run({ data: meta.data, transcript, facts: scenario.facts });
    const prose = ProseScore.run({ data: meta.data, transcript });
    const judge = options.judge && transcript.length ? await this._judge(meta.data, transcript) : null;
    this._emit('lab:text', { phase: 'done', probe, prose, judge, error });
    return { transcript, data: meta.data, probe, prose, judge, error };
  }

  async _turn(meta, history, userText, turnNo) {
    history.push({ role: 'user', content: userText });
    const turn = await this._mode.buildTurn({ meta, messages: history.slice(), conversationId: 'rp-lab-text', modelRef: meta.data.llmModel, contextWindow: LabTextRun.CONTEXT_WINDOW });
    const messages = this._shape.apply(turn, history.slice());
    const r = await this._narrate({
      messages, temperature: turn.temperature, modelRef: turn.modelRef || meta.data.llmModel || undefined,
      timeoutMs: LabTextRun.TURN_TIMEOUT_MS, trace: { conversationId: 'rp-lab-text', callType: 'rp-lab-text' },
    });
    if (!r || !r.text) throw new Error('turn ' + turnNo + ': the story model returned nothing' + (r && r.error ? ' (' + r.error + ')' : ''));
    const assistant = String(r.text).trim();
    history.push({ role: 'assistant', content: assistant });
    const messageId = 'rp-lab-text-' + turnNo;
    await this._mode.postProcess({
      content: assistant, conversationId: 'rp-lab-text', assistantMessageId: messageId, meta,
      emit: () => {}, setMeta: async (patch) => { if (patch && patch.data) meta.data = patch.data; },
    });
    return { turn: turnNo, user: userText, assistant, messageId, contextTokens: LabTextRun._estimate(messages) };
  }

  async _narrate(request) {
    const harness = this._active;
    if (harness) harness.active = false;
    try { return await this._complete(request); } finally { if (harness) harness.active = true; }
  }

  _harness(options) {
    if (!options.mockSideCalls || !this._Harness) return null;
    const harness = new this._Harness({ completeMocks: LabTextScenario.canned() });
    this._Harness.install(harness);
    return harness;
  }

  async _judge(data, transcript) {
    try {
      const r = await this._complete(ProseJudge.request(data, transcript));
      return r && r.text ? ProseJudge.parse(r.text) : null;
    } catch (_) {
      return null;
    }
  }

  static _estimate(messages) {
    return Math.ceil(messages.reduce((n, m) => n + String((m && m.content) || '').length, 0) / 3.6);
  }

  static _coreShaper() {
    try { return CoreRequire.require('llm-server/chat/router/ModeTurnMessages'); } catch (_) { return LabTextRun._fallbackShaper(); }
  }

  static _fallbackShaper() {
    return {
      apply(turn, messages) {
        const out = (turn && Array.isArray(turn.messages) && turn.messages.length) ? turn.messages.slice() : messages.slice();
        if (turn && turn.postHistoryPrompt && out.length && out[out.length - 1].role === 'user') {
          out[out.length - 1] = { ...out[out.length - 1], content: out[out.length - 1].content + '\n\n' + turn.postHistoryPrompt };
        }
        return turn && turn.systemPrompt ? [{ role: 'system', content: turn.systemPrompt }, ...out] : out;
      },
    };
  }
}

module.exports = LabTextRun;
