const LabTextScenarios = require('./LabTextScenarios');
const LabTurnDriver = require('./LabTurnDriver');
const ConsistencyProbe = require('./ConsistencyProbe');
const CastProbe = require('./CastProbe');
const ProseScore = require('./ProseScore');
const ProseJudge = require('./ProseJudge');
const PhysicalityJudge = require('./PhysicalityJudge');
const RevealJudge = require('./RevealJudge');
const BodyDetailScore = require('./BodyDetailScore');
const ContextAudit = require('./ContextAudit');
const RoleplayModeDescriptor = require('../mode/RoleplayModeDescriptor');

class LabTextRun {
  static GROUNDING_HEADINGS = ['How their bodies work', 'Up close this turn'];

  constructor({ router, mode, complete, Harness = null, emit = () => {}, modelRef = null, contextWindow = null, Driver = LabTurnDriver } = {}) {
    this._router = router;
    this._mode = mode;
    this._complete = complete;
    this._Harness = Harness;
    this._emit = emit;
    this._modelRef = modelRef;
    this._contextWindow = typeof contextWindow === 'function' ? contextWindow : null;
    this._Driver = Driver;
    this._active = null;
  }

  async run(options = {}) {
    const scenario = LabTextScenarios.resolve(options.scenario);
    const data = JSON.parse(JSON.stringify(scenario.data));
    if (options.grounding === false) data.options = Object.assign({}, data.options, { bodyGrounding: false, surfaceGrounding: false });
    if (typeof options.sideModel === 'string') data.sideModel = options.sideModel;
    if (this._contextWindow && scenario.contextWindow) this._contextWindow(scenario.contextWindow);
    const turns = scenario.turns.slice(0, options.turns > 0 ? options.turns : scenario.turns.length);
    const driver = new this._Driver({ router: this._router, descriptor: this._mode, modelRef: this._modelRef });
    this._active = this._harness(options, scenario);
    const harness = this._active;
    const transcript = [];
    let error = null;
    let world = data;
    try {
      driver.open(data);
      for (let i = 0; i < turns.length; i += 1) {
        const entry = await this._turn(driver, turns[i], i + 1, scenario);
        transcript.push(entry);
        this._emit('lab:text', { phase: 'turn', turn: i + 1, of: turns.length, user: entry.user, assistant: entry.assistant });
      }
    } catch (e) {
      error = (e && e.message) || String(e);
    } finally {
      if (harness) this._Harness.uninstall();
      this._active = null;
      if (driver.conversationId) world = driver.data();
      driver.close({ keep: !!options.keep });
    }
    const probe = ConsistencyProbe.run({ data: world, transcript, facts: scenario.facts });
    const cast = CastProbe.run({ data: world, transcript });
    const prose = ProseScore.run({ data: world, transcript });
    const bodyDetail = BodyDetailScore.run({ transcript });
    const grounding = LabTextRun._groundingSummary(transcript, scenario);
    const context = ContextAudit.summary(transcript.map((t) => t.audit));
    const calls = LabTextRun._callsSummary(transcript);
    const judge = options.judge && transcript.length ? await this._judge(ProseJudge, world, transcript) : null;
    const wantsBody = options.judge && transcript.length && (scenario.judges || []).includes('physicality');
    const physicality = wantsBody ? await this._judge(PhysicalityJudge, world, transcript) : null;
    const wantsReveal = options.judge && transcript.length && (scenario.judges || []).includes('reveal');
    const reveal = wantsReveal ? await this._revealJudge(world, transcript, scenario) : null;
    this._emit('lab:text', { phase: 'done', probe, cast, prose, judge, physicality, reveal, error });
    for (const t of transcript) delete t.context;
    return { scenario: scenario.name || null, transcript, data: world, probe, cast, prose, bodyDetail, grounding, context, calls, judge, physicality, reveal, error };
  }

  async _turn(driver, userText, turnNo, scenario = {}) {
    let played;
    try {
      played = await driver.play(userText);
    } catch (e) {
      throw new Error('turn ' + turnNo + ': ' + ((e && e.message) || String(e)));
    }
    if (!played.assistant) throw new Error('turn ' + turnNo + ': the story model returned nothing');
    const messages = played.request ? played.request.messages : [];
    const context = (scenario.recallTurns || []).includes(turnNo) ? LabTextRun._recallContext(messages) : null;
    const entry = {
      turn: turnNo, user: userText, assistant: played.assistant, messageId: played.messageId,
      contextTokens: LabTextRun._estimate(messages), ms: played.ms,
      calls: played.calls.map((c) => c.kind),
    };
    const grounding = RoleplayModeDescriptor.lastGrounding(driver.conversationId);
    if (grounding) entry.grounding = grounding;
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

  static _callsSummary(transcript) {
    const out = {};
    let narratorMs = 0;
    for (const t of transcript || []) {
      for (const kind of t.calls || []) {
        out[kind] = out[kind] || { n: 0 };
        out[kind].n += 1;
      }
      narratorMs += Number(t.ms) || 0;
    }
    if (out.narrator && out.narrator.n) out.narrator.ms = narratorMs;
    return out;
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
}

module.exports = LabTextRun;
