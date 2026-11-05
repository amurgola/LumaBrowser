const path = require('path');
const AcpSession = require('./AcpSession');
const JsonRpcStdio = require('./JsonRpcStdio');

const { JsonRpcError } = JsonRpcStdio;

class AcpAgent {
  static PROTOCOL_VERSION = 1;
  static AGENT_INFO = { name: 'lumabrowser', title: 'LumaBrowser' };

  constructor({ rpc, connect, defaults = {}, version = null, log = () => {} }) {
    this.rpc = rpc;
    this._connect = connect;
    this.defaults = { agent: defaults.agent || null, approval: defaults.approval === 'never' ? 'never' : 'ask' };
    this.version = version;
    this.log = log;
    this.sessions = new Map();
    this.clientInfo = null;
    this.clientCapabilities = null;
  }

  register() {
    this.rpc
      .handle('initialize', (p) => this.initialize(p))
      .handle('authenticate', () => ({}))
      .handle('session/new', (p) => this.newSession(p))
      .handle('session/load', (p) => this.loadSession(p))
      .handle('session/prompt', (p) => this.prompt(p))
      .handle('session/cancel', (p) => this.cancel(p))
      .handle('session/set_config_option', (p) => this.setConfigOption(p))
      .handle('session/close', (p) => this.closeSession(p));
    return this;
  }

  initialize(p) {
    const params = p || {};
    this.clientInfo = params.clientInfo && typeof params.clientInfo === 'object' ? params.clientInfo : null;
    this.clientCapabilities = params.clientCapabilities || null;
    this.log(`connected to ${AcpAgent.clientLabel(this.clientInfo)} (protocol ${params.protocolVersion})`);
    return {
      protocolVersion: AcpAgent.PROTOCOL_VERSION,
      agentCapabilities: {
        loadSession: true,
        promptCapabilities: { image: true, audio: false, embeddedContext: true },
        mcpCapabilities: { http: false, sse: false },
      },
      agentInfo: { ...AcpAgent.AGENT_INFO, version: this.version || '0.0.0' },
      authMethods: [],
    };
  }

  async newSession(p) {
    const params = p || {};
    const cwd = AcpAgent._cwd(params);
    const offered = Array.isArray(params.mcpServers) ? params.mcpServers.length : 0;
    if (offered) this.log(`ignoring ${offered} MCP server(s) the editor offered: LumaBrowser agents use the app's own tools`);
    const session = await this._open({ cwd, conversationId: null });
    this.log(`session ${session.id} in ${cwd}`);
    return { sessionId: session.id, configOptions: session.configOptions() };
  }

  async loadSession(p) {
    const params = p || {};
    const cwd = AcpAgent._cwd(params);
    const conversationId = String(params.sessionId || '');
    if (!conversationId) throw new JsonRpcError(JsonRpcStdio.INVALID_PARAMS, 'sessionId is required');
    const session = await this._open({ cwd, conversationId });
    const replayed = await session.replayHistory();
    this.log(`resumed session ${session.id} (${replayed} messages)`);
    return { configOptions: session.configOptions() };
  }

  prompt(p) {
    const params = p || {};
    return this._session(params).prompt(params.prompt);
  }

  cancel(p) {
    const session = this.sessions.get(String((p && p.sessionId) || ''));
    if (session) session.cancel();
  }

  async setConfigOption(p) {
    const params = p || {};
    const configOptions = await this._session(params).setConfigOption(params.configId, params.value);
    return { configOptions };
  }

  closeSession(p) {
    const id = String((p && p.sessionId) || '');
    const session = this.sessions.get(id);
    if (session) { this.sessions.delete(id); session.close(); }
    return {};
  }

  closeAll() {
    for (const [, session] of this.sessions) session.close();
    this.sessions.clear();
  }

  static clientLabel(info) {
    if (!info) return 'an ACP client';
    return `${info.title || info.name || 'an ACP client'}${info.version ? ` ${info.version}` : ''}`;
  }

  async _open({ cwd, conversationId }) {
    const ws = await this._connect();
    const session = new AcpSession({
      ws,
      rpc: this.rpc,
      cwd,
      agent: this.defaults.agent,
      approval: this.defaults.approval,
      client: this.clientInfo ? (this.clientInfo.name || this.clientInfo.title || null) : null,
      log: this.log,
    });
    try {
      await session.open({ conversationId });
      await session.loadAgents();
    } catch (e) {
      session.close();
      throw e;
    }
    this.sessions.set(session.id, session);
    session.onClosed = (s) => { if (this.sessions.get(s.id) === s) this.sessions.delete(s.id); };
    return session;
  }

  _session(params) {
    const session = this.sessions.get(String(params.sessionId || ''));
    if (!session) throw new JsonRpcError(JsonRpcStdio.INVALID_PARAMS, `unknown session: ${params.sessionId}`);
    return session;
  }

  static _cwd(params) {
    if (!params.cwd) throw new JsonRpcError(JsonRpcStdio.INVALID_PARAMS, 'cwd is required');
    return path.resolve(String(params.cwd));
  }
}

module.exports = AcpAgent;
