const path = require('path');
const LabRouter = require('./LabRouter');
const LabServerService = require('./LabServerService');
const LabChat = require('./LabChat');
const SwitchDispatcher = require('./SwitchDispatcher');

const EXT = path.join(__dirname, '..', '..', 'extensions', 'roleplay-mode');

class StateProbeRunner {
  static TURN_TIMEOUT_MS = 300000;

  constructor({ live = null, host = '127.0.0.1', port = 1, ctx = 16384, effort = 'default', modelStem = 'restored-story', options = {}, codeRoot = EXT } = {}) {
    this._live = live;
    this._host = host;
    this._port = port;
    this._ctx = ctx;
    this._effort = effort;
    this._stem = modelStem;
    this._options = options;
    const R = (rel) => require(path.join(codeRoot, rel));
    this._x = {
      RestoredStory: R('lab/RestoredStory'), StateProbes: R('lab/StateProbes'), LabTurnDriver: R('lab/LabTurnDriver'),
      RoleplayModeDescriptor: R('mode/RoleplayModeDescriptor'), RoleplayPostProcessor: R('pipeline/RoleplayPostProcessor'),
      Timeline: R('timeline'), TreeDigest: R('journal/TreeDigest'),
    };
  }

  get probes() {
    return this._x.StateProbes.list();
  }

  async restore({ window = null } = {}) {
    const { RestoredStory, LabTurnDriver, RoleplayModeDescriptor, RoleplayPostProcessor } = this._x;
    const chatStore = LabRouter.chatStore();
    const db = LabRouter.settingsDb();
    const service = new LabServerService({ chatStore, host: this._host, port: this._port, ctx: window || this._ctx, effort: this._effort, modelStem: this._stem });
    const dispatcher = new SwitchDispatcher({ script: RestoredStory.script(), live: this._live ? this._live({ service, db }) : null });
    const built = LabRouter.build({ service, mode: null, dispatcher, db });
    const chat = new LabChat({ router: built.router });
    const mode = RoleplayModeDescriptor.build(chat, new RoleplayPostProcessor(chat));
    built.registry.register(mode, 'roleplay-mode');
    const driver = new LabTurnDriver({ router: built.router, descriptor: mode, modelRef: 'local::' + this._stem });
    const conversationId = driver.open(RestoredStory.setup(this._options));
    const turns = [];
    for (const turn of RestoredStory.turns()) {
      const played = await driver.play(turn.player);
      const active = chatStore.listActiveMessages(conversationId);
      const at = active.findIndex((m) => m.id === played.messageId);
      turns.push({ userId: at > 0 ? active[at - 1].id : null, assistantId: played.messageId });
    }
    const session = { router: built.router, store: chatStore, conversationId, dispatcher, mode, turns, close: built.close };
    session.state = (ids = null) => this._state(session, ids);
    return session;
  }

  _state(session, ids = null) {
    const { Timeline, TreeDigest } = this._x;
    const meta = session.store.getMeta(session.conversationId);
    const data = JSON.parse(JSON.stringify((meta && meta.data) || {}));
    if (ids) { Timeline.ensure(data); Timeline.materialize(data, ids); }
    const s = TreeDigest.of([], data).state;
    return {
      turn: s.turn, scene: s.scene, pressure: s.pressure, threads: s.threads, ledger: s.ledger, cast: s.cast,
      presentNames: s.cast.filter((n) => !n.endsWith(' (off stage)')), summary: (data.story && data.story.summary) || '',
      points: Object.keys((data.timeline && data.timeline.entries) || {}).length,
    };
  }

  async run(probe) {
    const { StateProbes, LabTurnDriver } = this._x;
    const started = Date.now();
    const session = await this.restore({ window: probe.window || null });
    const out = { id: probe.id, title: probe.title, action: probe.action, contextOnly: !this._live, context: [], reply: [], request: null, replyText: '', before: null, after: null };
    try {
      const plan = this._plan(session, probe.action, LabTurnDriver);
      out.before = session.state(plan.continues);
      const requests = [];
      const stop = session.router.observeDispatch((r) => {
        if (r && r.trace && r.trace.conversationId === session.conversationId && r.trace.callType === 'chat') requests.push(r.messages);
      });
      if (this._live) session.dispatcher.goLive();
      try {
        const turn = await this._turn(session, plan.args, LabTurnDriver);
        out.replyText = turn.reply;
        out.reacted = turn.reacted;
      } finally {
        stop();
      }
      out.request = requests[requests.length - 1] || null;
      out.after = session.state();
      out.context = StateProbes.context(probe, { request: out.request, before: out.before });
      if (this._live) out.reply = StateProbes.reply(probe, { reply: out.replyText, after: out.reacted ? out.after : null });
    } catch (e) {
      out.error = (e && e.message) || String(e);
    } finally {
      session.close();
    }
    out.ms = Date.now() - started;
    out.passed = !out.error && out.context.concat(out.reply).every((c) => c.ok);
    return out;
  }

  _plan(session, action, LabTurnDriver) {
    const { store, conversationId, turns } = session;
    const active = () => store.listActiveMessages(conversationId);
    const upTo = (id, inclusive) => { const list = active(); const at = list.findIndex((m) => m.id === id); return list.slice(0, inclusive ? at + 1 : at); };
    const base = { conversationId, modelRef: 'local::' + this._stem };
    if (action.type === 'regenerate') {
      const t = turns[action.turn - 1];
      const before = upTo(t.userId, true);
      return { continues: upTo(t.userId, false).map((m) => m.id), args: Object.assign(base, { regenerateMessageId: t.assistantId, messages: LabTurnDriver.context(before) }) };
    }
    if (action.type === 'edit') {
      const t = turns[action.turn - 1];
      const before = upTo(t.userId, false);
      return { continues: before.map((m) => m.id), args: Object.assign(base, { editMessageId: t.userId, userMessage: action.text, messages: LabTurnDriver.context(before).concat([{ role: 'user', content: action.text }]) }) };
    }
    if (action.type === 'delete') {
      for (const t of turns.slice(-action.count).reverse()) { store.deleteMessage(t.assistantId); store.deleteMessage(t.userId); }
    }
    const path = active();
    return { continues: path.map((m) => m.id), args: Object.assign(base, { userMessage: action.text, messages: LabTurnDriver.context(path).concat([{ role: 'user', content: action.text }]) }) };
  }

  async _turn(session, args, LabTurnDriver) {
    const waiter = new LabTurnDriver.TurnWaiter();
    const controller = new AbortController();
    const res = await session.router.chat(Object.assign({}, args, {
      send: (type, payload) => waiter.on(type, payload), nested: { signal: controller.signal },
    }, LabTurnDriver.turnFlags(session.mode)));
    if (!res || !res.success) throw new Error((res && res.error) || 'the turn was not dispatched');
    waiter.expect(res.assistantMessageId);
    const done = await waiter.streamed(StateProbeRunner.TURN_TIMEOUT_MS, () => controller.abort());
    if (done.type === 'error') throw new Error((done.payload && done.payload.message) || 'the turn failed');
    const reaction = await waiter.reacted(StateProbeRunner.TURN_TIMEOUT_MS);
    const row = session.store.getMessage(res.assistantMessageId) || {};
    return { messageId: res.assistantMessageId, reply: String(row.content || ''), reacted: !!reaction && reaction.type !== 'mode:activity' };
  }

  async runAll({ ids = null, onResult = null } = {}) {
    const results = [];
    for (const probe of this.probes) {
      if (ids && ids.length && !ids.includes(probe.id)) continue;
      const r = await this.run(probe);
      results.push(r);
      if (onResult) onResult(r);
    }
    return results;
  }

  static report(results, { title = 'Roleplay state probes', lines = [] } = {}) {
    const out = ['# ' + title, ''].concat(lines, lines.length ? [''] : []);
    const count = (list) => list.filter((c) => c.ok).length + ' of ' + list.length;
    out.push('| Probe | Context checks | Reply checks | Result |', '| --- | --- | --- | --- |');
    for (const r of results) out.push('| ' + r.id + ' | ' + count(r.context) + ' | ' + (r.contextOnly ? 'not run' : count(r.reply)) + ' | ' + (r.error ? 'ERROR' : (r.passed ? 'pass' : 'FAIL')) + ' |');
    for (const r of results) {
      out.push('', '## ' + r.id + ': ' + r.title, '', 'Action: ' + JSON.stringify(r.action) + (r.error ? '\n\nERROR: ' + r.error : ''), '');
      if (r.before) out.push('Prepared from: turn ' + r.before.turn + ', ' + (r.before.scene || 'no place') + ', on stage ' + (r.before.presentNames.join(', ') || 'nobody') + '.', '');
      for (const c of r.context) out.push('- ' + (c.ok ? 'ok' : 'FAIL') + ' (context) ' + c.name + (c.detail ? ': ' + String(c.detail).replace(/\s+/g, ' ').slice(0, 200) : ''));
      for (const c of r.reply) out.push('- ' + (c.ok ? 'ok' : 'FAIL') + ' (reply) ' + c.name + (c.detail ? ': ' + String(c.detail).replace(/\s+/g, ' ').slice(0, 200) : ''));
      if (!r.contextOnly) {
        out.push('', 'Reply:', '', '````text', r.replyText || '(empty)', '````');
        if (r.after) out.push('', 'Afterwards: turn ' + r.after.turn + ', ' + (r.after.scene || 'no place') + ', on stage ' + (r.after.presentNames.join(', ') || 'nobody') + '.');
      }
    }
    return out.join('\n') + '\n';
  }
}

module.exports = StateProbeRunner;
