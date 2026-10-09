class BrowserRequestParser {
  static UPDATE_ACTIONS_HINT = 'Action must be one of: navigate, refresh, activate, executeJs';

  static tabId(value) {
    const tabId = parseInt(value);
    return Number.isNaN(tabId) ? null : tabId;
  }

  static updateAction(body = {}) {
    const action = body.action || body.type;
    const url = body.url || body.payload;
    if (action === 'navigate' || url) return BrowserRequestParser._navigate(url);
    if (action === 'refresh') return { action: { type: 'refresh' } };
    if (action === 'activate' || action === 'focus') return { action: { type: 'activate' } };
    if (action === 'executeJs' || body.script) return BrowserRequestParser._executeJs(body.script);
    return { error: 'Invalid action', message: BrowserRequestParser.UPDATE_ACTIONS_HINT };
  }

  static screenshotOptions(query = {}) {
    const options = {};
    if (query.fullPage === 'true') options.fullPage = true;
    if (query.cssScale === 'true') options.cssScale = true;
    if (query.marks === 'true') options.marks = true;
    return options;
  }

  static consoleOptions(query = {}) {
    return query.level ? { level: query.level } : {};
  }

  static tableOptions(query = {}) {
    const options = {};
    for (const key of ['selector', 'rowSelector', 'cellSelector']) {
      if (query[key]) options[key] = query[key];
    }
    return options;
  }

  static _navigate(url) {
    if (!url) return { error: 'URL is required for navigation', message: 'Please provide a URL' };
    return { action: { type: 'navigate', payload: url } };
  }

  static _executeJs(script) {
    if (!script) return { error: 'Script is required for JavaScript execution', message: 'Please provide JavaScript code to execute' };
    return { action: { type: 'executeJs', payload: script } };
  }
}

module.exports = BrowserRequestParser;
