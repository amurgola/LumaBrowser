const WebDriverError = require('./WebDriverError');

class PageScript {
  constructor(browser) {
    this._browser = browser;
  }

  async run(tabId, script) {
    const res = await this._browser.executeJs(tabId, script);
    if (!res || !res.success) throw WebDriverError.javascriptError(res && res.error ? res.error : 'executeJs failed');
    return res.data ? res.data.result : undefined;
  }

  url(tabId) {
    return this.run(tabId, 'window.location.href');
  }

  title(tabId) {
    return this.run(tabId, 'document.title');
  }
}

module.exports = PageScript;
