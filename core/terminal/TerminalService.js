const { EventEmitter } = require('events');

class TerminalService extends EventEmitter {
  static DEFAULT_SIZE = Object.freeze({ cols: 120, rows: 30 });
  static USER_HOLDS = 'The user has taken over this terminal. Ask them to hand it back, or read it with terminal_read.';

  constructor({ host, profiles, launch, apiPort = () => null, tabContext = null }) {
    super();
    this._host = host;
    this._profiles = profiles;
    this._launch = launch;
    this._apiPort = apiPort;
    this._tabContext = tabContext;
    this._sessions = new Map();
    this._nextId = 1;
  }

  get profiles() {
    return this._profiles;
  }

  async open(options = {}) {
    const profile = this._profileFor(options.profileId);
    const id = `t${this._nextId++}`;
    const launch = this._launchFor(profile, id, options);
    const info = await this._host.request('open', { id, launch, size: options.size || TerminalService.DEFAULT_SIZE });
    this._sessions.set(id, {
      info, origin: options.origin === 'agent' ? 'agent' : 'user', viewer: null, held: false, agentActive: options.origin === 'agent',
      besideTabId: options.besideTabId == null ? null : options.besideTabId,
    });
    this.emit('opened', this.get(id));
    return this.get(id);
  }

  list() {
    return [...this._sessions.keys()].map((id) => this.get(id));
  }

  get(id) {
    const session = this._sessions.get(id);
    if (!session) return null;
    return { ...session.info, origin: session.origin, viewed: !!session.viewer, held: session.held, agentActive: session.agentActive, besideTabId: session.besideTabId };
  }

  tabBeside(id) {
    const session = this._sessions.get(id);
    if (!session || session.besideTabId == null || !this._tabContext) return null;
    return this._tabContext.for(session.besideTabId);
  }

  async attach(id, viewer) {
    if (!this._sessions.has(id)) return null;
    const snapshot = await this._host.request('snapshot', { id }).catch(() => null);
    const session = this._sessions.get(id);
    if (!session) return null;
    if (session.viewer && session.viewer.key !== viewer.key) session.viewer.send({ type: 'detached', id });
    session.viewer = viewer;
    this._host.post('viewed', { id, viewed: true });
    return { session: this.get(id), snapshot };
  }

  detach(id, viewerKey) {
    const session = this._sessions.get(id);
    if (!session || !session.viewer || session.viewer.key !== viewerKey) return;
    session.viewer = null;
    this._host.post('viewed', { id, viewed: false });
  }

  write(id, data) {
    if (this._sessions.has(id)) this._host.post('write', { id, data: String(data) });
  }

  resize(id, size) {
    if (this._sessions.has(id)) this._host.post('resize', { id, cols: size && size.cols, rows: size && size.rows });
  }

  ack(id, chars) {
    if (this._sessions.has(id)) this._host.post('ack', { id, chars });
  }

  async close(id) {
    const session = this._sessions.get(id);
    if (!session) return { success: false, error: 'Unknown terminal' };
    this._sessions.delete(id);
    if (session.viewer) session.viewer.send({ type: 'closed', id });
    this.emit('closed', id);
    try { await this._host.request('close', { id }); } catch (_) {}
    return { success: true };
  }

  setHeld(id, held) {
    const session = this._sessions.get(id);
    if (!session) return { success: false };
    session.held = !!held;
    this._announce(id, session);
    return { success: true, held: session.held };
  }

  agentRun(id, params) {
    return this._agentInput(id, 'run', params);
  }

  agentSend(id, params) {
    return this._agentInput(id, 'send', params);
  }

  async agentRead(id, params) {
    if (!this._sessions.has(id)) return TerminalService._unknown(id);
    return this._host.request('read', { ...params, id });
  }

  async shutdown() {
    this._sessions.clear();
    await this._host.stop();
  }

  onHostEvent(event) {
    if (event.type === 'host-exit') return this._onHostGone();
    const session = this._sessions.get(event.sessionId);
    if (!session) return;
    if (event.type === 'data') return this._toViewer(session, { type: 'data', id: event.sessionId, data: event.data });
    const { type, sessionId, ...info } = event;
    session.info = info;
    this._announce(sessionId, session, type);
  }

  async _agentInput(id, method, params) {
    const session = this._sessions.get(id);
    if (!session) return TerminalService._unknown(id);
    if (session.held) return { error: TerminalService.USER_HOLDS };
    if (!session.agentActive) {
      session.agentActive = true;
      this._announce(id, session);
    }
    return this._host.request(method, { ...params, id });
  }

  _profileFor(profileId) {
    const profile = profileId ? this._profiles.get(profileId) : this._profiles.defaultProfile();
    if (!profile) throw new Error(profileId ? `Unknown terminal profile "${profileId}".` : 'No shell was found on this computer.');
    return profile;
  }

  _launchFor(profile, id, options) {
    const sessionEnv = this._sessionEnv(id, options.besideTabId);
    if (profile.kind !== 'app') return this._launch.build(profile, { cwd: options.cwd, startupCommand: options.startupCommand, sessionEnv });
    const shell = this._profiles.hostShell();
    if (!shell) throw new Error('No shell was found to run this app in.');
    return this._launch.build(shell, { cwd: options.cwd, startupCommand: profile.command, extraEnv: profile.env, sessionEnv, profileId: profile.id, label: profile.label });
  }

  _sessionEnv(id, besideTabId) {
    const port = this._apiPort();
    return {
      LUMA_TERMINAL: id,
      ...(port ? { LUMA_API_PORT: String(port) } : {}),
      ...(besideTabId == null ? {} : { LUMA_TAB_ID: String(besideTabId) }),
    };
  }

  _announce(id, session, type = 'state') {
    const view = this.get(id);
    this._toViewer(session, { type, id, session: view });
    this.emit('changed', view);
  }

  _toViewer(session, event) {
    if (session.viewer) session.viewer.send(event);
  }

  _onHostGone() {
    for (const [id, session] of this._sessions) {
      if (session.info.exited) continue;
      session.info = { ...session.info, exited: true, exitCode: null, busy: false };
      this._announce(id, session, 'exit');
    }
  }

  static _unknown(id) {
    return { error: `No terminal with id ${id}. terminal_list shows the open ones.` };
  }
}

module.exports = TerminalService;
