const BridgeLink = require('../BridgeLink');
const FrameWaiters = require('../FrameWaiters');
const RollbackBuffer = require('../RollbackBuffer');
const AcpPromptBlocks = require('./AcpPromptBlocks');
const AcpToolCards = require('./AcpToolCards');
const JsonRpcStdio = require('./JsonRpcStdio');

const { JsonRpcError } = JsonRpcStdio;

class AcpSession {
  static CODE_AGENT = 'code';
  static AGENT_OPTION = 'agent';
  static DECISIONS = ['once', 'run', 'reject'];

  constructor({ ws, rpc, cwd, agent = null, approval = 'ask', client = null, log = () => {} }) {
    this.id = null;
    this.rpc = rpc;
    this.cwd = cwd;
    this.agentName = agent;
    this.approval = approval === 'never' ? 'never' : 'ask';
    this.client = client;
    this.log = log;
    this.link = new BridgeLink(ws);
    this.waiters = new FrameWaiters();
    this.conversationId = null;
    this.ready = null;
    this.agents = null;
    this.onClosed = null;
    this._turn = null;
    this._closed = false;
    this.link.onFrame((type, p) => this._onFrame(type, p));
    this.link.onClose(() => this._onClose());
  }

  get busy() {
    return !!this._turn;
  }

  async open({ conversationId = null } = {}) {
    const ready = await this._hello({ agent: this.agentName, conversationId });
    if (ready.__error) throw AcpSession.bridgeError(ready.__error);
    if (conversationId && ready.resumeMissed) {
      throw new JsonRpcError(JsonRpcStdio.INVALID_PARAMS, `unknown session: ${conversationId}`, { code: ready.resumeMissed.code });
    }
    this.ready = ready;
    this.conversationId = ready.conversationId;
    if (!this.id) this.id = ready.conversationId;
    return ready;
  }

  async loadAgents() {
    this.link.send('list-agents');
    const p = await this.waiters.wait('agents');
    this.agents = p.__error ? { agents: [], defaultModel: null } : p;
    return this.agents;
  }

  async replayHistory() {
    this.link.send('history');
    const p = await this.waiters.wait('history');
    if (p.__error) throw AcpSession.bridgeError(p.__error);
    const messages = Array.isArray(p.messages) ? p.messages : [];
    for (const m of messages) {
      if (!m || !m.content) continue;
      this._update({ sessionUpdate: m.role === 'user' ? 'user_message_chunk' : 'agent_message_chunk', content: { type: 'text', text: String(m.content) } });
    }
    return messages.length;
  }

  configOptions() {
    const listing = this.agents || { agents: [], defaultModel: null };
    const current = this.ready && this.ready.agent ? String(this.ready.agent.id) : AcpSession.CODE_AGENT;
    const options = [{ value: AcpSession.CODE_AGENT, name: 'Code', description: listing.defaultModel ? `The Code agent on ${listing.defaultModel}` : 'The Code agent' }];
    for (const a of Array.isArray(listing.agents) ? listing.agents : []) {
      const option = { value: String(a.id), name: String(a.name || a.id) };
      const description = a.description || (a.model ? `model ${a.model}` : '');
      if (description) option.description = description;
      options.push(option);
    }
    return [{
      id: AcpSession.AGENT_OPTION,
      name: 'Agent',
      description: 'Which LumaBrowser agent answers in this session',
      category: '_agent',
      type: 'select',
      currentValue: options.some((o) => o.value === current) ? current : AcpSession.CODE_AGENT,
      options,
    }];
  }

  async setConfigOption(configId, value) {
    if (configId !== AcpSession.AGENT_OPTION) throw new JsonRpcError(JsonRpcStdio.INVALID_PARAMS, `unknown config option: ${configId}`);
    if (this._turn) throw new JsonRpcError(JsonRpcStdio.INTERNAL_ERROR, 'the agent cannot change while a turn is running');
    const agent = value === AcpSession.CODE_AGENT || value == null ? null : String(value);
    const ready = await this._hello({ agent, conversationId: this.conversationId });
    if (ready.__error) throw AcpSession.bridgeError(ready.__error);
    this.agentName = agent;
    this.ready = ready;
    this.conversationId = ready.conversationId;
    return this.configOptions();
  }

  prompt(blocks) {
    if (this._turn) return Promise.reject(new JsonRpcError(JsonRpcStdio.INTERNAL_ERROR, 'a turn is already running in this session'));
    if (this._closed) return Promise.reject(new JsonRpcError(JsonRpcStdio.INTERNAL_ERROR, 'LumaBrowser closed the connection'));
    const payload = AcpPromptBlocks.toBridgePrompt(blocks);
    if (!payload.text && !payload.images.length) return Promise.reject(new JsonRpcError(JsonRpcStdio.INVALID_PARAMS, 'prompt needs text'));
    return new Promise((resolve, reject) => {
      this._turn = {
        resolve,
        reject,
        cancelled: false,
        cards: new AcpToolCards({ cwd: this.cwd }),
        buffer: new RollbackBuffer((text) => this._chunk('agent_message_chunk', text)),
      };
      const frame = { text: payload.text };
      if (payload.images.length) frame.images = payload.images;
      if (payload.context.length) frame.context = payload.context;
      this.link.send('prompt', frame);
    });
  }

  cancel() {
    if (!this._turn) return false;
    this._turn.cancelled = true;
    this.link.send('abort');
    return true;
  }

  close() {
    this._closed = true;
    try { this.link.close(); } catch (_) {}
  }

  static decisionOf(result) {
    const outcome = result && result.outcome;
    if (!outcome || outcome.outcome !== 'selected') return 'reject';
    return AcpSession.DECISIONS.includes(outcome.optionId) ? outcome.optionId : 'reject';
  }

  static stopReasonOf(payload, turn) {
    if ((payload && payload.aborted) || (turn && turn.cancelled)) return 'cancelled';
    if (payload && payload.finishReason === 'length') return 'max_tokens';
    return 'end_turn';
  }

  static bridgeError(err) {
    const e = err || {};
    return new JsonRpcError(JsonRpcStdio.INTERNAL_ERROR, e.message || 'LumaBrowser refused the request', e.code ? { code: e.code } : undefined);
  }

  _hello({ agent, conversationId }) {
    this.link.send('hello', {
      cwd: this.cwd,
      agent: agent || null,
      conversationId: conversationId || null,
      approval: this.approval,
      suggest: false,
      origin: 'ide',
      client: this.client ? `acp/${this.client}` : 'acp',
    });
    return this.waiters.wait('ready');
  }

  _onFrame(type, p) {
    const payload = p && typeof p === 'object' ? p : {};
    if (this.waiters.deliver(type, payload)) return;
    const turn = this._turn;
    if (!turn) return;
    switch (type) {
      case 'delta': if (payload.text) turn.buffer.push(payload.text); break;
      case 'rollback': turn.buffer.rollback(payload.chars); break;
      case 'reasoning-delta': if (payload.text) this._chunk('agent_thought_chunk', payload.text); break;
      case 'tool': this._tool(turn, payload); break;
      case 'command:output': this._send(turn.cards.commandOutput(payload)); break;
      case 'agent': this._send(turn.cards.delegation(payload)); break;
      case 'done': this._finish(turn, payload); break;
      case 'error': this._fail(turn, payload.message || 'chat failed'); break;
      case 'busy': this._fail(turn, payload.message || 'LumaBrowser is busy with another chat turn'); break;
      case 'bridge-error': this._fail(turn, payload.message || 'bridge error'); break;
      default: break;
    }
  }

  _tool(turn, p) {
    switch (p.phase) {
      case 'approval': turn.buffer.flush(); this._askPermission(turn, p); break;
      case 'approval-done': this._send(turn.cards.approvalDone(p)); break;
      case 'run': turn.buffer.flush(); this._send(turn.cards.run(p)); break;
      case 'done': case 'result': this._send(turn.cards.done(p)); break;
      default: break;
    }
  }

  _askPermission(turn, p) {
    const { update, request } = turn.cards.approval(p);
    this._update(update);
    this.rpc.request('session/request_permission', { sessionId: this.id, ...request }).then(
      (result) => this._answer(AcpSession.decisionOf(result)),
      () => this._answer('reject'),
    );
  }

  _answer(decision) {
    if (this._closed) return;
    this.link.send('approve', { decision });
  }

  _finish(turn, payload) {
    turn.buffer.flush();
    for (const u of turn.cards.closeOpen(payload.aborted ? 'Cancelled.' : 'The turn ended.')) this._update(u);
    this._turn = null;
    turn.resolve({ stopReason: AcpSession.stopReasonOf(payload, turn) });
  }

  _fail(turn, message) {
    turn.buffer.flush();
    for (const u of turn.cards.closeOpen(message)) this._update(u);
    this._turn = null;
    if (turn.cancelled) { turn.resolve({ stopReason: 'cancelled' }); return; }
    turn.reject(new JsonRpcError(JsonRpcStdio.INTERNAL_ERROR, message));
  }

  _onClose() {
    if (this._closed) return;
    this._closed = true;
    const turn = this._turn;
    if (turn) this._fail(turn, 'LumaBrowser closed the connection');
    if (typeof this.onClosed === 'function') this.onClosed(this);
  }

  _chunk(kind, text) {
    this._update({ sessionUpdate: kind, content: { type: 'text', text } });
  }

  _send(update) {
    if (update) this._update(update);
  }

  _update(update) {
    this.rpc.notify('session/update', { sessionId: this.id, update });
  }
}

module.exports = AcpSession;
