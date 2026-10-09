const path = require('path');
const CoreRequire = require('../CoreRequire');
const TerminalAgents = require('./TerminalAgents');
const TerminalConversations = require('./TerminalConversations');
const FollowupSuggester = require('./FollowupSuggester');
const CommitMessageDrafter = require('./CommitMessageDrafter');

const IdeContextFormatter = CoreRequire.require('llm-server/chat/IdeContextFormatter');

class TerminalSession {
  static MAX_CLIENT_CHARS = 80;
  static BUSY_MESSAGE = 'LumaBrowser is busy with another chat turn. Try again in a moment.';

  constructor(ws, { getRouter, getAgentManager, getLlmServer, fso, runGit }) {
    this.ws = ws;
    this.getRouter = getRouter;
    this.getAgentManager = getAgentManager;
    this.getLlmServer = getLlmServer || (() => null);
    this.fso = fso;
    this.conversationId = null;
    this.cwd = null;
    this.origin = 'terminal';
    this.modelRef = null;
    this.approval = 'ask';
    this.turnActive = false;
    this.followups = [];
    this.closed = false;
    this.suggest = false;
    this.turnSeq = 0;
    this._created = null;
    this._suggester = new FollowupSuggester(this);
    this._commits = new CommitMessageDrafter(this, runGit);
    ws.on('message', (data) => this.onMessage(data));
    ws.on('error', () => {});
  }

  send(type, payload) {
    if (this.closed) return;
    try { this.ws.send(JSON.stringify({ type, payload: payload === undefined ? null : payload })); } catch (_) {}
  }

  fail(message, code) {
    this.send('bridge-error', { message, code: code || null });
  }

  dispose() {
    this.closed = true;
    this._suggester.stop();
    this._commits.stop();
    if (!this.turnActive) this._dropIfEmpty();
    if (this.turnActive) {
      this._abortRouter();
      this.turnActive = false;
    }
  }

  onMessage(data) {
    let msg = null;
    try { msg = JSON.parse(String(data)); } catch (_) { return this.fail('frame is not JSON'); }
    if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') return this.fail('frame needs a type');
    const p = msg.payload && typeof msg.payload === 'object' ? msg.payload : {};
    try {
      return this._dispatch(msg.type, p);
    } catch (e) {
      return this.fail((e && e.message) || 'bridge failure');
    }
  }

  listAgents() {
    this.send('agents', TerminalAgents.listing(this.getAgentManager(), this.getRouter()));
  }

  hello(p) {
    const router = this.getRouter();
    if (!router || !router.chatStore) return this.fail('the chat router is not ready yet', 'not-ready');
    const cwd = this._directory(p.cwd);
    if (!cwd) return this.fail(`cwd is not a directory: ${p.cwd || '(none)'}`, 'bad-cwd');
    this._applyHello(p, cwd);
    const agent = p.agent ? TerminalAgents.resolve(this.getAgentManager(), String(p.agent)) : null;
    if (p.agent && !agent) return this.fail(`no agent named "${p.agent}"`, 'no-agent');
    this.modelRef = this._modelFor(router, agent);
    if (!this.modelRef) return this.fail('no model is configured in LumaBrowser yet', 'no-model');
    const opened = this._openConversation(router.chatStore, p, agent);
    if (opened.error) return this.fail(opened.error[1], opened.error[0]);
    return this.send('ready', {
      conversationId: this.conversationId,
      agent: agent ? { id: agent.id, name: agent.name } : null,
      model: this.modelRef,
      root: cwd,
      resumedMessages: opened.resumed,
      approval: this.approval,
      resumeMissed: opened.resumeMissed,
    });
  }

  async prompt(p) {
    if (!this.conversationId) return this.fail('send hello first', 'no-session');
    const text = p.text == null ? '' : String(p.text);
    const images = Array.isArray(p.images) ? p.images.filter((i) => i && i.base64) : [];
    if (!text.trim() && !images.length) return this.fail('prompt needs text', 'empty');
    const router = this.getRouter();
    if (!router) return this.fail('the chat router is not ready yet', 'not-ready');
    if (this.turnActive) return this._queue(text);
    if (router.active) return this.send('busy', { message: TerminalSession.BUSY_MESSAGE });
    return this._runTurn(router, text, images, p.context);
  }

  followup(p) {
    const text = p.text == null ? '' : String(p.text);
    if (!text.trim()) return this.fail('followup needs text', 'empty');
    if (!this.turnActive) return this.prompt({ text });
    return this._queue(text);
  }

  approve(p) {
    const router = this.getRouter();
    const decision = p.decision === 'run' ? 'run' : p.decision === 'once' ? 'once' : 'reject';
    const accepted = !!(router && router.respondApproval && router.respondApproval(decision));
    this.send('approve-result', { decision, accepted });
  }

  abort() {
    this.followups = [];
    this._abortRouter();
    this.send('abort-result', { ok: true });
  }

  openInApp() {
    if (!this.conversationId) return this.fail('send hello first', 'no-session');
    const svc = this.getLlmServer();
    let ok = false;
    try { ok = !!(svc && typeof svc.openConversation === 'function' && svc.openConversation(this.conversationId)); } catch (_) { ok = false; }
    return this.send('open-in-app-result', { ok, conversationId: this.conversationId });
  }

  commitMessage(p) {
    return this._commits.draft(p);
  }

  onTurnEnd() {
    if (!this.turnActive) return;
    this.turnActive = false;
    const next = this.followups.shift();
    if (next != null && !this.closed) {
      this.send('followup-start', { text: next, pending: this.followups.length });
      this.prompt({ text: next });
      return;
    }
    if (this.suggest && !this.closed) this._suggester.suggest();
  }

  _dispatch(type, p) {
    switch (type) {
      case 'hello': return this.hello(p);
      case 'prompt': return this.prompt(p);
      case 'followup': return this.followup(p);
      case 'approve': return this.approve(p);
      case 'abort': return this.abort();
      case 'list-agents': return this.listAgents();
      case 'open-in-app': return this.openInApp();
      case 'commit-message': return this.commitMessage(p);
      default: return this.fail(`unknown frame type: ${type}`);
    }
  }

  _directory(rawCwd) {
    const cwd = rawCwd ? path.resolve(String(rawCwd)) : '';
    let stat = null;
    try { stat = cwd ? this.fso.statSync(cwd) : null; } catch (_) { stat = null; }
    return stat && stat.isDirectory() ? cwd : null;
  }

  _modelFor(router, agent) {
    const turn = agent ? TerminalAgents.turnOf(this.getAgentManager(), agent.id) : null;
    return (turn && turn.modelRef) || TerminalAgents.defaultModel(router);
  }

  _applyHello(p, cwd) {
    this.cwd = cwd;
    this.approval = p.approval === 'never' ? 'never' : 'ask';
    this.suggest = !!p.suggest;
    this.origin = p.origin === 'ide' ? 'ide' : 'terminal';
  }

  _openConversation(store, p, agent) {
    const client = p.client ? String(p.client).slice(0, TerminalSession.MAX_CLIENT_CHARS) : null;
    const soft = p.origin === 'ide' || p.resumeOrNew === true;
    const resumeId = p.conversationId ? String(p.conversationId) : null;
    const problem = resumeId ? TerminalConversations.resumeProblem(store, resumeId) : null;
    if (problem && !soft) return { error: problem };
    const target = { cwd: this.cwd, origin: this.origin, client, agent, modelRef: this.modelRef };
    if (resumeId && !problem) {
      this.conversationId = resumeId;
      return { resumed: TerminalConversations.resume(store, resumeId, target), resumeMissed: null };
    }
    this._createConversation(store, target);
    return { resumed: 0, resumeMissed: problem ? { conversationId: resumeId, code: problem[0] } : null };
  }

  _createConversation(store, target) {
    if (!this.turnActive) this._dropIfEmpty();
    this.conversationId = TerminalConversations.create(store, target);
    this._created = { id: this.conversationId, store };
  }

  _dropIfEmpty() {
    const created = this._created;
    this._created = null;
    if (created) TerminalConversations.dropIfEmpty(created.store, created.id);
  }

  _queue(text) {
    this.followups.push(text);
    this.send('queued', { pending: this.followups.length });
  }

  async _runTurn(router, text, images, ideContext) {
    const block = IdeContextFormatter.render(ideContext);
    const messages = [...this._history(router.chatStore), { role: 'user', content: block ? `${text}\n\n${block}` : text }];
    this.turnActive = true;
    this.turnSeq += 1;
    this._suggester.stop();
    let res;
    try {
      res = await router.chat({
        conversationId: this.conversationId,
        modelRef: this.modelRef,
        messages,
        userMessage: text,
        agent: true,
        tools: true,
        attachments: TerminalSession._attachments(images),
        approvalOverride: this.approval,
        send: (type, payload) => this._relay(type, payload),
      });
    } catch (e) {
      this.send('error', { message: (e && e.message) || 'chat failed' });
      return this.onTurnEnd();
    }
    if (res && res.success === false) {
      this.send('error', { message: res.error || 'chat failed' });
      this.onTurnEnd();
    }
    return undefined;
  }

  _relay(type, payload) {
    this.send(type, payload);
    if (type === 'done' || type === 'error') this.onTurnEnd();
  }

  _history(store) {
    try {
      return store.listActiveMessages(this.conversationId)
        .filter((m) => m && (m.content || m.role === 'user'))
        .map((m) => ({ role: m.role, content: m.content || '' }));
    } catch (_) {
      return [];
    }
  }

  _abortRouter() {
    const router = this.getRouter();
    try { if (router && router.abort) router.abort(); } catch (_) {}
  }

  static _attachments(images) {
    return images.map((i) => ({ kind: 'image', name: i.name || 'image', mime: i.mime || 'image/png', base64: i.base64 }));
  }
}

module.exports = TerminalSession;
