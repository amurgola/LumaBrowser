class MonitorTextExtractor {
  constructor(browser) {
    this._browser = browser;
  }

  async extract(tabId, monitor) {
    const selectors = Array.isArray(monitor.selectors) ? monitor.selectors : null;
    if (selectors && selectors.length > 0) return this._extractSelected(tabId, selectors);
    return this._extractPage(tabId);
  }

  static selectorScript(selectors) {
    return `(function() {
      var sels = ${JSON.stringify(selectors)};
      return sels.map(function(sel) {
        try {
          var el = document.querySelector(sel);
          if (!el) return '[missing: ' + sel + ']';
          return (el.innerText || el.textContent || '').trim();
        } catch (e) {
          return '[invalid: ' + sel + ']';
        }
      }).join('\\n---\\n');
    })()`;
  }

  async _extractSelected(tabId, selectors) {
    const result = await this._browser.executeJs(tabId, MonitorTextExtractor.selectorScript(selectors));
    if (result && result.success && result.data && typeof result.data.result === 'string') return result.data.result;
    return null;
  }

  async _extractPage(tabId) {
    const result = await this._browser.getSource(tabId, { type: 'text' });
    return result && result.success ? result.source : null;
  }
}

module.exports = MonitorTextExtractor;
