const WebDriverCommandGroup = require('./WebDriverCommandGroup');
const WebDriverError = require('../WebDriverError');
const SessionCapabilities = require('../SessionCapabilities');
const FallbackConfig = require('../FallbackConfig');

class SessionCommands extends WebDriverCommandGroup {
  commandNames() {
    return ['newSession', 'deleteSession', 'status', 'getTimeouts', 'setTimeouts'];
  }

  async newSession(_session, _params, req) {
    const merged = SessionCapabilities.merge(SessionCommands._body(req).capabilities);
    const llmFallback = FallbackConfig.normalize(merged['lumabyte:llmFallback'], this._tools.fallbackDefaults);
    const tabId = await this._sessionTabId();
    const session = this._tools.registry.create({ tabId, capabilities: merged, llmFallback });
    return { sessionId: session.id, capabilities: SessionCapabilities.returned(merged, llmFallback) };
  }

  async deleteSession(session) {
    this._tools.registry.delete(session.id);
    return null;
  }

  async status() {
    return {
      ready: true,
      message: 'LumaBrowser WebDriver ready',
      build: { version: '1.0.0' },
      os: {
        arch: process.arch,
        name: SessionCapabilities.platformName(),
        version: process.getSystemVersion ? process.getSystemVersion() : '',
      },
      sessions: this._tools.registry.size(),
    };
  }

  async getTimeouts(session) {
    return session.timeouts;
  }

  async setTimeouts(session, _params, req) {
    const body = SessionCommands._body(req);
    if (typeof body.script === 'number' || body.script === null) session.timeouts.script = body.script;
    if (typeof body.pageLoad === 'number') session.timeouts.pageLoad = body.pageLoad;
    if (typeof body.implicit === 'number') session.timeouts.implicit = body.implicit;
    return null;
  }

  async _sessionTabId() {
    const tabs = await this._browser.getTabs();
    if (!tabs.success) throw WebDriverError.sessionNotCreated(tabs.error || 'could not list tabs');
    if (tabs.tabs && tabs.tabs.length > 0) return tabs.tabs[0].id;
    const created = await this._browser.createTab('about:blank');
    if (!created.success) throw WebDriverError.sessionNotCreated(created.error || 'could not create tab');
    return created.tab.id;
  }
}

module.exports = SessionCommands;
