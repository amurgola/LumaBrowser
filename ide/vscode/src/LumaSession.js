'use strict';

const { EventEmitter } = require('events');
const SessionStatus = require('./SessionStatus');
const CommitRequestBook = require('./CommitRequestBook');
const PromptContext = require('./PromptContext');
const BridgeFramePayloads = require('./BridgeFramePayloads');
const ToolStepHooks = require('./ToolStepHooks');

class LumaSession extends EventEmitter {
  static READY_TIMEOUT_MS = 90000;
  static RESTRICTED_MESSAGE = 'This window is in Restricted Mode. Trust the folder to let the Code agent work in it (Start LumaBrowser below opens the trust dialog).';
  static NO_FOLDER_MESSAGE = 'Open a folder first: the Code agent works on the folder you have open (Start LumaBrowser below opens the folder picker).';

  constructor({ connectLib, getRoot, getSettings, resolveExecutable, clientName, ideName, hooks = {}, resumeId = null, isTrusted = () => true }) {
    super();
    this.connectLib = connectLib;
    this.getRoot = getRoot;
    this.getSettings = getSettings;
    this.resolveExecutable = resolveExecutable;
    this.clientName = String(clientName || 'vscode').slice(0, 80);
    this.ideName = ideName || 'VS Code';
    this.hooks = hooks;
    this.isTrusted = isTrusted;
    this._initState(resumeId);
  }

  log(m) {
    try { if (this.hooks.log) this.hooks.log(m); } catch (_) {}
  }

  setState(patch) {
    if (patch) Object.assign(this, patch);
    this.emit('state');
  }

  async connect({ startIfNeeded, resume, agentName } = {}) {
    const settings = this.getSettings();
    if (startIfNeeded === undefined) startIfNeeded = settings.autoStart !== false;
    if (resume === undefined) resume = this.conversationId;
    if (agentName === undefined) agentName = (this.agent && this.agent.name) || settings.defaultAgent || null;
    const seq = ++this._connectSeq;
    this._disconnectClient();
    this.root = this.getRoot() || '';
    if (!this._mayConnect()) return;
    this.setState({ status: SessionStatus.CONNECTING, statusMessage: '' });
    try {
      await this._openSocket(seq, !!startIfNeeded, agentName, resume);
    } catch (e) {
      if (seq === this._connectSeq) this._connectFailed(e, startIfNeeded);
    }
  }

  disconnect() {
    this._connectSeq++;
    this._disconnectClient();
    this.setState({ status: SessionStatus.OFFLINE, statusMessage: '', streaming: false });
  }

  awaitReady(timeoutMs = LumaSession.READY_TIMEOUT_MS) {
    if (this.status === SessionStatus.READY && this._client) return Promise.resolve(true);
    if (this.status !== SessionStatus.CONNECTING && this.status !== SessionStatus.STARTING) this.connect({ startIfNeeded: true });
    return new Promise((resolve) => {
      const done = (ok) => { clearTimeout(timer); this.removeListener('state', check); resolve(ok); };
      const check = () => {
        if (this.status === SessionStatus.READY) done(!!this._client);
        else if (this.status === SessionStatus.ERROR || this.status === SessionStatus.OFFLINE) done(false);
      };
      const timer = setTimeout(() => done(false), timeoutMs);
      this.on('state', check);
    });
  }

  send(type, payload) {
    const c = this._client;
    if (!c) return false;
    try { c.send(JSON.stringify({ type, payload: payload || {} })); return true; } catch (_) { return false; }
  }

  hello(agentName, resume) {
    this._pendingHelloAgent = agentName || null;
    this._pendingHelloResume = resume || null;
    this.send('hello', {
      cwd: this.root,
      agent: agentName || null,
      conversationId: resume || null,
      approval: this.approval,
      suggest: this.getSettings().suggestFollowups !== false,
      origin: 'ide',
      client: this.clientName,
    });
  }

  newSession(agentName) {
    if (agentName === undefined) agentName = this.agent ? this.agent.name : null;
    this._forgetConversation();
    if (!this._client || this.status !== SessionStatus.READY) { this.connect({ resume: null, agentName }); return; }
    this.hello(agentName, null);
  }

  switchAgent(agentName) {
    this.newSession(agentName || null);
  }

  setApproval(mode) {
    this.approval = mode === 'never' ? 'never' : 'ask';
    try { if (this.hooks.setApprovalSetting) this.hooks.setApprovalSetting(this.approval); } catch (_) {}
    if (this._client && this.status === SessionStatus.READY && !this.streaming) this.hello(this.agent ? this.agent.name : null, this.conversationId);
    this.setState();
  }

  prompt(text, items) {
    if (!text || !String(text).trim() || !this._client) return;
    const payload = { text: String(text) };
    const list = Array.isArray(items) ? items : [];
    if (list.length) payload.context = PromptContext.toWire(list, this.hooks.readContextText);
    this.setState({ streaming: true });
    this.send('prompt', payload);
    const sent = new Set(list.map((i) => i.id));
    this.context = this.context.filter((c) => !sent.has(c.id));
  }

  followup(text) { this.send('followup', { text }); }
  approve(decision) { this.send('approve', { decision }); this._toolHooks.expireApproval(); }
  abort() { this.send('abort', {}); }
  requestAgents() { this.send('list-agents', {}); }
  openInApp() { if (!this._client) this.connect(); else this.send('open-in-app', {}); }

  generateCommitMessage(diff, files, hint) {
    if (!this._client || this.status !== SessionStatus.READY) return Promise.reject(new Error('LumaBrowser is not connected.'));
    return this._commits.open((requestId) => {
      const payload = { requestId, diff, cwd: this.root, files: files || [] };
      if (hint && String(hint).trim()) payload.hint = String(hint);
      return this.send('commit-message', payload);
    });
  }

  addContext(item) {
    this.context = PromptContext.withItem(this.context, item);
    this.setState();
  }

  removeContext(id) { this.context = this.context.filter((c) => c.id !== id); this.setState(); }
  clearContext() { this.context = []; this.setState(); }

  onSocketMessage(text) {
    let msg;
    try { msg = JSON.parse(String(text)); } catch (_) { return; }
    if (!msg || typeof msg.type !== 'string') return;
    this.onFrame(msg.type, msg.payload && typeof msg.payload === 'object' ? msg.payload : {});
  }

  onFrame(type, p) {
    if (type === 'bridge-error' && this._recoverFromBridgeError(p)) return;
    this._applyFrame(type, p);
    this.emit('frame', type, p);
  }

  stateJson() {
    const s = this.getSettings();
    return {
      status: this.status,
      statusMessage: this.statusMessage,
      agent: this.agent,
      model: this.model,
      root: this.root,
      approval: this.approval,
      streaming: this.streaming,
      resumedMessages: this.resumedMessages,
      conversationId: this.conversationId,
      showReasoning: !!s.showReasoning,
      suggest: s.suggestFollowups !== false,
      ideName: this.ideName,
      context: PromptContext.toChips(this.context),
    };
  }

  dispose() {
    this._connectSeq++;
    this._disconnectClient();
    this._commits.failAll('The window was closed.');
    this._toolHooks.expireApproval();
    this.removeAllListeners();
  }

  _initState(resumeId) {
    this.status = SessionStatus.OFFLINE;
    this.statusMessage = '';
    this.conversationId = resumeId || null;
    this.agent = null;
    this.model = null;
    this.root = this.getRoot() || '';
    this.approval = this.getSettings().approval === 'never' ? 'never' : 'ask';
    this.streaming = false;
    this.resumedMessages = 0;
    this.agents = [];
    this.context = [];
    this._client = null;
    this._connectSeq = 0;
    this._pendingHelloAgent = null;
    this._pendingHelloResume = null;
    this._commits = new CommitRequestBook();
    this._toolHooks = new ToolStepHooks(this);
  }

  _mayConnect() {
    if (!this.isTrusted()) {
      this.setState({ status: SessionStatus.ERROR, statusMessage: LumaSession.RESTRICTED_MESSAGE, streaming: false });
      return false;
    }
    if (!this.root) {
      this.setState({ status: SessionStatus.ERROR, statusMessage: LumaSession.NO_FOLDER_MESSAGE, streaming: false });
      return false;
    }
    return true;
  }

  async _openSocket(seq, autoStart, agentName, resume) {
    const target = await this.connectLib.discover({
      autoStart,
      resolveExecutable: this.resolveExecutable,
      log: (msg) => { if (seq === this._connectSeq) this.setState({ status: SessionStatus.STARTING, statusMessage: 'Starting LumaBrowser…' }); this.log(msg); },
    });
    if (seq !== this._connectSeq) return;
    this.setState({ status: SessionStatus.CONNECTING, statusMessage: 'Connecting…' });
    const ws = await this.connectLib.openBridge(target);
    if (seq !== this._connectSeq) { try { ws.close(); } catch (_) {} return; }
    this.log(`bridge connected on port ${target.port}`);
    ws.on('message', (text) => this.onSocketMessage(text));
    ws.on('close', () => this._onClosed(seq));
    ws.on('error', () => {});
    this._client = ws;
    this.hello(agentName, resume);
  }

  _connectFailed(e, startIfNeeded) {
    this.log(`connect failed: ${e && e.message}`);
    this.setState({ status: SessionStatus.ERROR, statusMessage: LumaSession._connectErrorText(e, startIfNeeded), streaming: false });
  }

  static _connectErrorText(e, startIfNeeded) {
    if (!(e && e.code === 'NOT_RUNNING')) return (e && e.message) || 'connection failed';
    return startIfNeeded
      ? 'LumaBrowser is not running and no installation was found. Start it yourself, or set its location in Settings (luma.appExecutable).'
      : 'LumaBrowser is not running.';
  }

  _onClosed(seq) {
    if (seq !== this._connectSeq) return;
    this._client = null;
    this._commits.failAll('The connection to LumaBrowser dropped.');
    this._toolHooks.expireApproval();
    this.setState({
      status: SessionStatus.OFFLINE,
      statusMessage: this.streaming ? 'The connection to LumaBrowser dropped mid-turn.' : '',
      streaming: false,
    });
  }

  _disconnectClient() {
    const c = this._client;
    if (!c) return;
    this._client = null;
    try { c.removeAllListeners('close'); c.close(); } catch (_) {}
    this._commits.failAll('Disconnected from LumaBrowser.');
  }

  _forgetConversation() {
    this.streaming = false;
    this.conversationId = null;
    this.resumedMessages = 0;
    this._persistConversation();
    this.emit('reset');
  }

  _startedFresh() {
    this._forgetConversation();
    this._notify('warn', 'The previous conversation was deleted in LumaBrowser. Started a new one.');
  }

  _recoverFromBridgeError(p) {
    const code = typeof p.code === 'string' ? p.code : null;
    if ((code === 'no-conversation' || code === 'not-code') && this._pendingHelloResume) {
      this._startedFresh();
      this.hello(this._pendingHelloAgent, null);
      return true;
    }
    if (this.status !== SessionStatus.READY && code === 'no-agent' && this._pendingHelloAgent) {
      this._notify('warn', `No LumaBrowser agent named "${this._pendingHelloAgent}"; using the Code agent.`);
      this.hello(null, null);
      return true;
    }
    return false;
  }

  _applyFrame(type, p) {
    switch (type) {
      case 'ready': this._onReady(p); break;
      case 'agents': this.setState({ agents: BridgeFramePayloads.agentRows(p) }); break;
      case 'bridge-error': this._onBridgeError(p); break;
      case 'commit-message-result': this._commits.settle(p); break;
      case 'meta': if (typeof p.conversationId === 'string') { this.conversationId = p.conversationId; this._persistConversation(); } break;
      case 'followup-start': this.setState({ streaming: true }); break;
      case 'done': case 'error': case 'busy': this._toolHooks.expireApproval(); this.setState({ streaming: false }); break;
      case 'tool': this._toolHooks.onTool(p); break;
      default: break;
    }
  }

  _onReady(p) {
    if (p.resumeMissed && typeof p.resumeMissed === 'object') this._startedFresh();
    this.setState(BridgeFramePayloads.readyState(p, { root: this.root, approval: this.approval }));
    this._persistConversation();
    this.requestAgents();
  }

  _onBridgeError(p) {
    if (this.status !== SessionStatus.READY) this.setState({ status: SessionStatus.ERROR, statusMessage: p.message ? String(p.message) : 'bridge error' });
    else if (this.streaming) this.setState({ streaming: false });
  }

  _notify(level, message) {
    try { if (this.hooks.notify) this.hooks.notify(level, message); } catch (_) {}
  }

  _persistConversation() {
    try { if (this.hooks.saveConversationId) this.hooks.saveConversationId(this.conversationId); } catch (_) {}
  }
}

module.exports = LumaSession;
