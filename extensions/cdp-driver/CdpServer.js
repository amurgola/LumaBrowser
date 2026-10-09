const http = require('http');
const { WebSocketServer } = require('ws');
const CdpConnection = require('./CdpConnection');
const CdpDefaults = require('./CdpDefaults');
const CdpDispatcher = require('./CdpDispatcher');
const CdpFrameHandler = require('./CdpFrameHandler');
const CdpHttpBootstrap = require('./CdpHttpBootstrap');
const CdpIds = require('./CdpIds');
const CdpSession = require('./CdpSession');
const CdpSessionRegistry = require('./CdpSessionRegistry');
const CdpTargetRegistry = require('./CdpTargetRegistry');
const CdpTargetTracker = require('./CdpTargetTracker');
const DebuggerProxy = require('./DebuggerProxy');
const FallbackConfig = require('./FallbackConfig');
const LoopbackRequestGuard = require('../../core/shared/net/LoopbackRequestGuard');

class CdpServer {
  static AUTOMATION_TAB_KIND = CdpDefaults.AUTOMATION_TAB_KIND;

  static DEFAULT_BROWSER_CONTEXT_ID = CdpDefaults.DEFAULT_BROWSER_CONTEXT_ID;

  static PAGE_PATH = /^\/devtools\/page\/([A-F0-9]+)$/;

  constructor(options) {
    this.browser = options.browser;
    this.fallback = options.fallback || null;
    this.fallbackDefaults = options.fallbackDefaults || {};
    this.browserUuid = CdpIds.newUuid();
    this.targets = new CdpTargetRegistry();
    this.sessions = new CdpSessionRegistry();
    this.debugger = new DebuggerProxy(this.browser);
    this.connections = new Set();
    this.browserContexts = new Set([CdpDefaults.DEFAULT_BROWSER_CONTEXT_ID]);
    this.httpServer = null;
    this.wss = null;
    this.host = null;
    this._frames = new CdpFrameHandler(this.sessions, new CdpDispatcher(this));
    this._http = new CdpHttpBootstrap(this);
    this._tracker = new CdpTargetTracker(this);
    this._tracker.subscribe(this.browser);
  }

  async start(port, host = '127.0.0.1') {
    this.host = host;
    this.httpServer = http.createServer((req, res) => this._http.handle(req, res));
    this.wss = new WebSocketServer({ noServer: true });
    this.httpServer.on('upgrade', (req, socket, head) => this._onUpgrade(req, socket, head));
    return this._listen(port, host);
  }

  async stop() {
    this._closeSockets();
    await this._closeHttpServer();
    this.connections.clear();
    try { this.debugger.detachAll(); } catch (_) {}
    await this.closeAutomationTabs();
    this.sessions.clear();
    this.targets.clear();
    this._tracker.unsubscribe();
  }

  isRunning() { return !!this.httpServer; }

  port() {
    const addr = this.httpServer ? this.httpServer.address() : null;
    return addr ? addr.port : null;
  }

  broadcast(frame) {
    for (const connection of this.connections) {
      if (connection.wantsBroadcast(frame)) connection.send(frame);
    }
  }

  async attachSession(connection, target, flatten = true) {
    await this.debugger.attach(target.tabId);
    const session = this.sessions.add(new CdpSession({
      sessionId: CdpIds.newUuid(),
      targetId: target.targetId,
      connection,
      flatten,
      llmFallback: FallbackConfig.normalize(null, this.fallbackDefaults),
    }));
    target.attached = true;
    return session;
  }

  async createAutomationTab(url, options) {
    const created = await this.browser.createTab(url, options);
    if (!created || !created.success) throw new Error((created && created.error) || 'could not create tab');
    return created.tab;
  }

  async closeAutomationTabs() {
    const listed = await this.browser.getTabs();
    const tabs = listed && listed.success ? listed.tabs || [] : [];
    for (const tab of tabs) {
      if (tab.kind === CdpDefaults.AUTOMATION_TAB_KIND) await this.closeTab(tab.id);
    }
  }

  async closeTab(tabId) {
    try { await this.browser.getTabManager().closeTab(tabId); } catch (_) {}
  }

  activateTab(tabId) {
    try { this.browser.getTabManager().tabViewManager.switchToTab(tabId); } catch (_) {}
  }

  activeSessions() {
    return this.sessions.all().map((s) => ({ sessionId: s.sessionId, targetId: s.targetId, createdAt: s.createdAt }));
  }

  activeTargets() {
    return this.targets.all().map((t) => t.toInfo());
  }

  _listen(port, host) {
    return new Promise((resolve, reject) => {
      this.httpServer.once('error', reject);
      this.httpServer.listen(port, host, () => {
        console.log(`cdp-driver: CDP server listening on ws://${host}:${this.port()}/devtools/browser/${this.browserUuid}`);
        resolve(this.port());
      });
    });
  }

  _onUpgrade(req, socket, head) {
    const refused = LoopbackRequestGuard.refusal(req, this.host);
    if (refused) return LoopbackRequestGuard.rejectUpgrade(socket, refused);
    const url = req.url || '';
    if (url === `/devtools/browser/${this.browserUuid}`) return this._accept(req, socket, head, { scope: 'browser' });
    const match = CdpServer.PAGE_PATH.exec(url);
    if (match && this.targets.get(match[1])) return this._accept(req, socket, head, { scope: 'page', targetId: match[1] });
    socket.destroy();
  }

  _accept(req, socket, head, meta) {
    this.wss.handleUpgrade(req, socket, head, (ws) => this._onConnection(ws, meta));
  }

  _onConnection(ws, meta) {
    const connection = new CdpConnection(ws, meta);
    this.connections.add(connection);
    ws.on('message', (data) => this._frames.handle(connection, data));
    ws.on('close', () => this._onClose(connection));
    ws.on('error', () => this._onClose(connection));
    if (meta.scope === 'page') this._openImplicitSession(connection, meta.targetId);
  }

  _openImplicitSession(connection, targetId) {
    const target = this.targets.get(targetId);
    const attached = target ? this.attachSession(connection, target) : Promise.reject(new Error(`Unknown target ${targetId}`));
    attached.then((session) => { connection.implicitSessionId = session.sessionId; }).catch((err) => {
      console.warn('cdp-driver: failed to attach implicit session:', err.message);
      try { connection.ws.close(1011, 'implicit-attach-failed'); } catch (_) {}
    });
  }

  _onClose(connection) {
    this.connections.delete(connection);
    for (const session of this.sessions.byConnection(connection)) this.sessions.delete(session.sessionId);
  }

  _closeSockets() {
    if (!this.wss) return;
    for (const client of this.wss.clients) {
      try { client.terminate(); } catch (_) {}
    }
    this.wss.close();
    this.wss = null;
  }

  async _closeHttpServer() {
    if (!this.httpServer) return;
    await new Promise((resolve) => this.httpServer.close(() => resolve()));
    this.httpServer = null;
  }
}

module.exports = CdpServer;
