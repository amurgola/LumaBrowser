const CdpDomain = require('./CdpDomain');
const CdpDefaults = require('../CdpDefaults');
const CdpError = require('../CdpError');
const CdpIds = require('../CdpIds');
const CdpTarget = require('../CdpTarget');

class TargetDomain extends CdpDomain {
  handlers() {
    return {
      'Target.getTargets': () => this.getTargets(),
      'Target.setDiscoverTargets': (params, scope) => this.setDiscoverTargets(params, scope.connection),
      'Target.setAutoAttach': (params, scope) => this.setAutoAttach(params, scope.connection),
      'Target.attachToTarget': (params, scope) => this.attachToTarget(params, scope.connection),
      'Target.detachFromTarget': (params, scope) => this.detachFromTarget(params, scope.connection),
      'Target.createTarget': (params) => this.createTarget(params),
      'Target.closeTarget': (params) => this.closeTarget(params),
      'Target.activateTarget': (params) => this.activateTarget(params),
      'Target.createBrowserContext': () => this.createBrowserContext(),
      'Target.disposeBrowserContext': (params) => this.disposeBrowserContext(params),
      'Target.getBrowserContexts': () => this.getBrowserContexts(),
    };
  }

  async getTargets() {
    return { targetInfos: this._server.targets.all().map((t) => t.toInfo()) };
  }

  async setDiscoverTargets(params, connection) {
    connection.discoverTargets = !!(params && params.discover);
    if (connection.discoverTargets) this._announceExistingTargets(connection);
    return {};
  }

  async setAutoAttach(params, connection) {
    connection.autoAttach = !!(params && params.autoAttach);
    connection.waitForDebuggerOnStart = !!(params && params.waitForDebuggerOnStart);
    connection.flatten = !params || params.flatten !== false;
    if (connection.autoAttach) await this._attachToEveryTarget(connection);
    return {};
  }

  async attachToTarget(params, connection) {
    const target = this._server.targets.get(params && params.targetId);
    if (!target) throw CdpError.invalidParams(`No target with id ${params && params.targetId}`);
    const session = await this._attachAndAnnounce(connection, target);
    return { sessionId: session.sessionId };
  }

  async detachFromTarget(params, connection) {
    const sessionId = params && params.sessionId;
    const session = sessionId ? this._server.sessions.get(sessionId) : null;
    if (!session) return {};
    this._server.sessions.delete(sessionId);
    connection.send({ method: 'Target.detachedFromTarget', params: { sessionId, targetId: session.targetId } });
    return {};
  }

  async createTarget(params) {
    const url = (params && params.url) || 'about:blank';
    const browserContextId = (params && params.browserContextId) || CdpDefaults.DEFAULT_BROWSER_CONTEXT_ID;
    const tab = await this._server.createAutomationTab(url, this._tabOptionsFor(browserContextId));
    const target = this._server.targets.byTab(tab.id) || this._registerMissingTarget(tab, browserContextId);
    target.browserContextId = browserContextId;
    return { targetId: target.targetId };
  }

  async closeTarget(params) {
    const target = this._server.targets.get(params && params.targetId);
    if (!target) return { success: false };
    await this._server.closeTab(target.tabId);
    return { success: true };
  }

  async activateTarget(params) {
    const target = this._server.targets.get(params && params.targetId);
    if (target) this._server.activateTab(target.tabId);
    return {};
  }

  async createBrowserContext() {
    const browserContextId = CdpIds.newUuid();
    this._server.browserContexts.add(browserContextId);
    return { browserContextId };
  }

  async disposeBrowserContext(params) {
    const id = params && params.browserContextId;
    if (!id) return {};
    await this._closeTargetsInContext(id);
    if (id !== CdpDefaults.DEFAULT_BROWSER_CONTEXT_ID) this._server.browserContexts.delete(id);
    return {};
  }

  async getBrowserContexts() {
    return { browserContextIds: [...this._server.browserContexts] };
  }

  _announceExistingTargets(connection) {
    for (const target of this._server.targets.all()) {
      connection.send({ method: 'Target.targetCreated', params: { targetInfo: target.toInfo() } });
    }
  }

  async _attachToEveryTarget(connection) {
    for (const target of this._server.targets.all()) await this._attachAndAnnounce(connection, target);
  }

  async _attachAndAnnounce(connection, target) {
    const session = await this._server.attachSession(connection, target, connection.flatten !== false);
    connection.send({
      method: 'Target.attachedToTarget',
      params: { sessionId: session.sessionId, targetInfo: target.toInfo(), waitingForDebugger: false },
    });
    return session;
  }

  _tabOptionsFor(browserContextId) {
    const options = { kind: CdpDefaults.AUTOMATION_TAB_KIND, activate: false };
    if (browserContextId !== CdpDefaults.DEFAULT_BROWSER_CONTEXT_ID) {
      options.partition = `persist:cdp-ctx-${browserContextId}`;
    }
    return options;
  }

  _registerMissingTarget(tab, browserContextId) {
    const target = this._server.targets.add(new CdpTarget({
      targetId: CdpIds.newUuid(), type: 'page', tabId: tab.id, url: tab.url, title: tab.title, browserContextId,
    }));
    this._server.broadcast({ method: 'Target.targetCreated', params: { targetInfo: target.toInfo() } });
    return target;
  }

  async _closeTargetsInContext(browserContextId) {
    for (const target of this._server.targets.all()) {
      if (target.browserContextId === browserContextId) await this._server.closeTab(target.tabId);
    }
  }
}

module.exports = TargetDomain;
