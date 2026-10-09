const SafeFetch = require('./SafeFetch');
const SilentTab = require('./web-tools/SilentTab');
const FetchQueue = require('./live-api/FetchQueue');
const LivePageRequest = require('./live-api/LivePageRequest');
const LivePageFetch = require('./live-api/LivePageFetch');
const ExtensionApiCall = require('../../shell/extensions/ExtensionApiCall');

class LiveApi {
  static MAX_CONCURRENT = 2;
  static MAX_QUEUED = 8;

  constructor({ getAgentDeps, getExtensionManager = null, fetcher = SafeFetch.fetch } = {}) {
    this._getAgentDeps = getAgentDeps;
    this._getExtensionManager = typeof getExtensionManager === 'function' ? getExtensionManager : () => null;
    this._fetcher = fetcher;
    this._queue = new FetchQueue({ maxConcurrent: LiveApi.MAX_CONCURRENT, maxQueued: LiveApi.MAX_QUEUED });
  }

  static validHttpUrl(url) {
    return LivePageRequest.validHttpUrl(url);
  }

  fetchPage(params = {}) {
    return this._queue.run(() => this._fetchPage(params));
  }

  async openTab(params = {}) {
    const url = LiveApi.validHttpUrl(params.url);
    if (!url) return { success: false, error: 'openTab needs an absolute http(s) URL.' };
    const browserService = this._browserService();
    if (!browserService) return { success: false, error: 'The browser is not available yet.' };
    try {
      const created = await browserService.createTab(url, { kind: 'user' });
      return { success: true, tabId: LiveApi._tabIdOf(created) };
    } catch (err) {
      return { success: false, error: (err && err.message) || String(err) };
    }
  }

  async extCall(params = {}) {
    const manager = this._getExtensionManager();
    if (!manager) return { success: false, error: 'Extensions are not available yet.' };
    return ExtensionApiCall.invoke(manager, params.extensionId, params.method, params.args);
  }

  async _fetchPage(params) {
    const request = LivePageRequest.from(params);
    if (!request) return { success: false, error: 'fetchPage needs an absolute http(s) URL.' };
    return new LivePageFetch({ fetcher: this._fetcher, tabFetch: this._tabFetch() }).execute(request);
  }

  _tabFetch() {
    const browserService = this._browserService();
    return browserService ? SilentTab.make(browserService) : null;
  }

  _browserService() {
    const deps = typeof this._getAgentDeps === 'function' ? this._getAgentDeps() : null;
    return (deps && deps.browserService) || null;
  }

  static _tabIdOf(created) {
    const tab = created && created.tab;
    if (!tab) return tab;
    return tab.id != null ? tab.id : tab.tabId;
  }
}

module.exports = LiveApi;
