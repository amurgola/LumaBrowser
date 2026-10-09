const WebDriverCommandGroup = require('./WebDriverCommandGroup');
const WebDriverError = require('../WebDriverError');

class NavigationCommands extends WebDriverCommandGroup {
  commandNames() {
    return ['navigateTo', 'getCurrentUrl', 'goBack', 'goForward', 'refresh', 'getTitle'];
  }

  async navigateTo(session, _params, req) {
    const { url } = NavigationCommands._body(req);
    if (!url) throw WebDriverError.invalidArgument('url is required');
    const res = await this._browser.navigate(session.tabId, url);
    if (!res.success) throw WebDriverError.unknownError(res.error || 'navigation failed');
    return null;
  }

  async getCurrentUrl(session) {
    return this._page.url(session.tabId);
  }

  async goBack(session) {
    await this._page.run(session.tabId, 'history.back()');
    return null;
  }

  async goForward(session) {
    await this._page.run(session.tabId, 'history.forward()');
    return null;
  }

  async refresh(session) {
    const res = await this._browser.refresh(session.tabId);
    if (!res.success) throw WebDriverError.unknownError(res.error || 'refresh failed');
    return null;
  }

  async getTitle(session) {
    return this._page.title(session.tabId);
  }
}

module.exports = NavigationCommands;
