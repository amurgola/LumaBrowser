const CoreRequire = require('../CoreRequire');
const LabTextScenarios = require('./LabTextScenarios');
const ConsistencyProbe = require('./ConsistencyProbe');
const CastProbe = require('./CastProbe');
const ProseScore = require('./ProseScore');
const ProseJudge = require('./ProseJudge');
const PhysicalityJudge = require('./PhysicalityJudge');
const RevealJudge = require('./RevealJudge');
const BodyDetailScore = require('./BodyDetailScore');
const ContextAudit = require('./ContextAudit');

class LabTextRun {
  static TURN_TIMEOUT_MS = 300000;
  static CONTEXT_WINDOW = 16384;
  static GROUNDING_HEADINGS = ['How their bodies work', 'Up close this turn'];

  constructor({ mode, complete, Harness = null, emit = () => {}, ModeTurnMessages = null } = {}) {
    this._mode = mode;
    this._complete = complete;
    this._Harness = Harness;
    this._emit = emit;
    this._shape = ModeTurnMessages || LabTextRun._coreShaper();
    this._active = null;
  }

  async run(options = {}) {
    const scenario = LabTextScenarios.resolve(options.scenario);
    const meta = { mode: 'roleplay', data: JSON.parse(JSON.stringify(scenario.data)) };
    if (options.grounding === false) meta.data.options = Object.assign({}, meta.data.options, { bodyGrounding: false, surfaceGrounding: false });
    const turns = scenario.turns.slice(0, options.turns > 0 ? options.turns : scenario.turns.length);
    this._active = this._harness(options, scenario);
    const harness = this._active;
    const transcript = [];
    let error = null;
    try {
      const history = [];
      for (let i = 0; i < turns.length; i += 1) {
        const entry = await this._turn(meta, history, turns[i], i + 1, scenario);
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
    const cast = CastProbe.run({ data: meta.data, transcript });
    const prose = ProseScore.run({ data: meta.data, transcript });
    const bodyDetail = BodyDetailScore.run({ transcript });
    const grounding = LabTextRun._groundingSummary(transcript, scenario);
    const context = ContextAudit.summary(transcript.map((t) => t.audit));
    const judge = options.judge && transcript.length ? await this._judge(ProseJudge, meta.data, transcript) : null;
    const wantsBody = options.judge && transcript.length && (scenario.judges || []).includes('physicality');
    const physicality = wantsBody ? await this._judge(PhysicalityJudge, meta.data, transcript) : null;
    const wantsReveal = options.judge && transcript.length && (scenario.judges || []).includes('reveal');
    const reveal = wantsReveal ? await this._revealJudge(meta.data, transcript, scenario) : null;
    this._emit('lab:text', { phase: 'done', probe, cast, prose, judge, physicality, reveal, error });
    for (const t of transcript) delete t.context;
    return { scenario: scenario.name || null, transcript, data: meta.data, probe, cast, prose, bodyDetail, grounding, context, judge, physicality, reveal, error };
  }

  async _turn(meta, history, userText, turnNo, scenario = {}) {
    history.push({ role: 'user', content: userText });
    const contextWindow = scenario.contextWindow || LabTextRun.CONTEXT_WINDOW;
    const turn = await this._mode.buildTurn({ meta, messages: history.slice(), conversationId: 'rp-lab-text', modelRef: meta.data.llmModel, contextWindow });
    const messages = this._shape.apply(turn, history.slice());
    const context = (scenario.recallTurns || []).includes(turnNo) ? LabTextRun._recallContext(messages) : null;
    const r = await this._narrate({
      messages, temperature: turn.temperature, modelRef: turn.modelRef || meta.data.llmModel || undefined,
      samplers: turn.samplers || undefined,
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
    const entry = { turn: turnNo, user: userText, assistant, messageId, contextTokens: LabTextRun._estimate(messages) };
    if (turn.groundingNotes) entry.grounding = turn.groundingNotes;
    entry.audit = ContextAudit.of(messages);
    if (context != null) entry.context = context;
    return entry;
  }

  static _groundingSummary(transcript, scenario = {}) {
    const cards = {};
    let turnsWithCards = 0;
    for (const t of transcript || []) {
      const g = t.grounding;
      if (!g) continue;
      turnsWithCards += 1;
      for (const layer of ['body', 'surface']) {
        for (const list of Object.values(g[layer] || {})) for (const id of list) cards[id] = (cards[id] || 0) + 1;
      }
    }
    const expectNone = !!scenario.expectNoGrounding;
    return { turnsWithCards, cards, expectNone, ok: expectNone ? turnsWithCards === 0 : true };
  }

  static _recallContext(messages) {
    const list = Array.isArray(messages) ? messages : [];
    const text = (m) => String((m && m.content) || '');
    const sys = list.length && list[0].role === 'system' ? text(list[0]) : '';
    const memory = LabTextRun.GROUNDING_HEADINGS.reduce((s, h) => s.replace(new RegExp('## ' + h + '[\\s\\S]*?(?=\\n## |$)'), ''), sys);
    const last = list.length ? text(list[list.length - 1]) : '';
    const anchor = last.includes('[Scene notes') ? last.slice(last.indexOf('[Scene notes')) : '';
    const replies = list.filter((m) => m && m.role === 'assistant').map(text);
    return { memory: memory + '\n' + anchor, replies };
  }

  async _narrate(request) {
    const harness = this._active;
    if (harness) harness.active = false;
    try { return await this._complete(request); } finally { if (harness) harness.active = true; }
  }

  _harness(options, scenario) {
    if (!options.mockSideCalls || !this._Harness) return null;
    const harness = new this._Harness({ completeMocks: (scenario && scenario.canned) || LabTextScenarios.resolve().canned });
    this._Harness.install(harness);
    return harness;
  }

  async _revealJudge(data, transcript, scenario) {
    let r = null;
    try {
      const res = await this._complete(RevealJudge.request(data, transcript.map((t) => ({ turn: t.turn, user: t.user, assistant: t.assistant })), scenario));
      r = res && res.text ? RevealJudge.parse(res.text) : null;
    } catch (_) {
      r = null;
    }
    if (!r) return null;
    const earlier = (turn) => r.reveals.filter((x) => x.turn < turn);
    const replyOf = new Map(transcript.map((t) => [t.turn, t.assistant]));
    r.retention = transcript.filter((t) => t.context != null).map((t) => {
      const inHistory = new Set([...replyOf].filter(([, text]) => t.context.replies.includes(text)).map(([turn]) => turn));
      return Object.assign({ turn: t.turn }, RevealJudge.retention(earlier(t.turn), { memory: t.context.memory, inHistory }));
    });
    return r;
  }

  async _judge(Judge, data, transcript) {
    try {
      const r = await this._complete(Judge.request(data, transcript));
      return r && r.text ? Judge.parse(r.text) : null;
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
