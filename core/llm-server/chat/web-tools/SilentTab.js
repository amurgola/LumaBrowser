const PageClassifier = require('./PageClassifier');

class SilentTab {
  static PARTITION = 'persist:websearch';
  static DEFAULT_SETTLE_MS = 12000;
  static MIN_SETTLE_MS = 3000;
  static POLL_INTERVAL_MS = 400;
  static STABLE_MIN_CHARS = 500;

  static make(browserService, options) {
    const tab = new SilentTab(browserService, options);
    return (url, opts) => tab.render(url, opts);
  }

  constructor(browserService, { partition = SilentTab.PARTITION, isAborted = () => false } = {}) {
    this._browser = browserService;
    this._partition = partition;
    this._isAborted = isAborted;
  }

  async render(url, opts = {}) {
    let tabId = null;
    try {
      tabId = await this._open(url);
      if (tabId == null) return null;
      return await this._waitForContent(tabId, SilentTab._sourceType(opts), opts.needle || null, SilentTab._settleMs(opts));
    } catch (_) {
      return null;
    } finally {
      await this._close(tabId);
    }
  }

  static _sourceType(opts) {
    return opts.html ? 'full' : (opts.mode || 'markdown');
  }

  static _settleMs(opts) {
    return Math.max(Number(opts.timeoutMs) || SilentTab.DEFAULT_SETTLE_MS, SilentTab.MIN_SETTLE_MS);
  }

  async _open(url) {
    const created = await this._browser.createTab(url, { silent: true, kind: 'user', partition: this._partition });
    const tab = created && created.tab;
    if (!tab) return null;
    return tab.id != null ? tab.id : tab.tabId;
  }

  async _waitForContent(tabId, type, needle, settleMs) {
    const deadline = Date.now() + settleMs;
    const best = { any: '', clean: '' };
    let previousLength = -1;
    while (Date.now() < deadline && !this._isAborted()) {
      const source = await this._snapshot(tabId, type);
      if (source.length > best.any.length) best.any = source;
      if (PageClassifier.isChallenge(source)) { previousLength = -1; continue; }
      if (source.length > best.clean.length) best.clean = source;
      if (SilentTab._isSettled(source, needle, previousLength)) return source;
      previousLength = source.length;
    }
    return best.clean || best.any || null;
  }

  static _isSettled(source, needle, previousLength) {
    if (needle) return source.includes(needle);
    return source.trim().length > SilentTab.STABLE_MIN_CHARS && source.length === previousLength;
  }

  async _snapshot(tabId, type) {
    await new Promise((resolve) => setTimeout(resolve, SilentTab.POLL_INTERVAL_MS));
    const result = await this._browser.getSource(tabId, { type });
    return result && result.success && typeof result.source === 'string' ? result.source : '';
  }

  async _close(tabId) {
    if (tabId == null) return;
    try {
      await this._browser.closeTab(tabId);
    } catch (_) {}
  }
}

module.exports = SilentTab;
