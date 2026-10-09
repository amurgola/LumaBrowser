const CdpDefaults = require('./CdpDefaults');
const CdpIds = require('./CdpIds');
const CdpTarget = require('./CdpTarget');

class CdpTargetTracker {
  constructor(server) {
    this._server = server;
    this._unsubscribers = [];
  }

  subscribe(browser) {
    this._track(browser.onTabCreated, browser, (tab) => this._onTabCreated(tab));
    this._track(browser.onTabClosed, browser, (tabId) => this._onTabClosed(tabId));
    this._track(browser.onTabNavigated, browser, (tabId, url) => this._onTabNavigated(tabId, url));
  }

  unsubscribe() {
    for (const off of this._unsubscribers.splice(0)) {
      try { off(); } catch (_) {}
    }
  }

  _track(subscribeFn, browser, listener) {
    if (typeof subscribeFn !== 'function') return;
    const off = subscribeFn.call(browser, listener);
    if (typeof off === 'function') this._unsubscribers.push(off);
  }

  _onTabCreated(tab) {
    if (!tab || tab.kind !== CdpDefaults.AUTOMATION_TAB_KIND) return;
    const target = this._server.targets.add(new CdpTarget({
      targetId: CdpIds.newUuid(),
      type: 'page',
      tabId: tab.id,
      url: tab.url,
      title: tab.title,
      browserContextId: CdpDefaults.DEFAULT_BROWSER_CONTEXT_ID,
    }));
    this._server.broadcast({ method: 'Target.targetCreated', params: { targetInfo: target.toInfo() } });
    this._fanOutDebuggerEvents(target);
  }

  _onTabClosed(tabId) {
    const target = this._server.targets.byTab(tabId);
    if (!target) return;
    this._detachSessions(target);
    this._server.broadcast({ method: 'Target.targetDestroyed', params: { targetId: target.targetId } });
    this._server.targets.delete(target.targetId);
    try { this._server.debugger.detach(tabId); } catch (_) {}
  }

  _onTabNavigated(tabId, url) {
    const target = this._server.targets.byTab(tabId);
    if (!target) return;
    target.url = url;
    this._server.broadcast({ method: 'Target.targetInfoChanged', params: { targetInfo: target.toInfo() } });
  }

  _detachSessions(target) {
    for (const session of this._server.sessions.byTarget(target.targetId)) {
      session.connection.send({
        method: 'Target.detachedFromTarget',
        params: { sessionId: session.sessionId, targetId: target.targetId },
      });
      this._server.sessions.delete(session.sessionId);
    }
  }

  _fanOutDebuggerEvents(target) {
    this._server.debugger.on(`event:${target.tabId}`, ({ method, params }) => {
      for (const session of this._server.sessions.byTarget(target.targetId)) {
        session.connection.send(session.connection.eventFrameFor(session, method, params));
      }
    });
  }
}

module.exports = CdpTargetTracker;
