const Faults = require('./spec/Faults');
const ToolNames = require('./spec/ToolNames');
const EndpointSpec = require('./spec/EndpointSpec');

class SiteApiService {
  constructor({ store, runner, toolHost = null, browser = null, emit = () => {} }) {
    this._store = store;
    this._runner = runner;
    this._toolHost = toolHost;
    this._browser = browser;
    this._emit = emit;
  }

  get store() { return this._store; }
  get runner() { return this._runner; }


  listSites() {
    return this._store.listSites().map((site) => ({ ...site, endpoints: this._store.listEndpoints(site.id).map(SiteApiService._endpointSummary.bind(null, site)) }));
  }

  getSite(id) {
    return this._store.getSite(id);
  }

  createSite(input) {
    const site = this._store.createSite(input);
    this._changed('site', site.id);
    return site;
  }

  updateSite(id, patch) {
    const site = this._store.updateSite(id, patch);
    this._changed('site', id);
    return site;
  }

  deleteSite(id) {
    const removed = this._store.deleteSite(id);
    if (removed) { this._refreshTools(); this._changed('site', id); }
    return removed;
  }


  listEndpoints(siteId = null) {
    return this._store.listEndpoints(siteId).map((endpoint) => SiteApiService._endpointSummary(this._store.getSite(endpoint.siteId), endpoint));
  }

  getEndpoint(id) {
    return this._store.getEndpoint(id);
  }

  getEndpointByName(siteId, name) {
    return this._store.getEndpointByName(siteId, name);
  }

  createEndpoint(input) {
    const endpoint = this._store.createEndpoint(input);
    this._refreshTools();
    this._changed('endpoint', endpoint.id);
    return endpoint;
  }

  updateEndpoint(id, patch) {
    const endpoint = this._store.updateEndpoint(id, patch);
    this._refreshTools();
    this._changed('endpoint', id);
    return endpoint;
  }

  deleteEndpoint(id) {
    const removed = this._store.deleteEndpoint(id);
    if (removed) { this._refreshTools(); this._changed('endpoint', id); }
    return removed;
  }


  async run(siteId, endpointName, params = {}, opts = {}) {
    const site = this._store.getSite(siteId);
    const endpoint = site ? this._store.getEndpointByName(siteId, endpointName) : null;
    if (!site || !endpoint) {
      return SiteApiService.faultResult(Faults.make(Faults.UNKNOWN_ENDPOINT, `No endpoint "${endpointName}" on site "${siteId}"`));
    }
    const result = await this._runner.run(site, endpoint, params, opts);
    this._changed('run', endpoint.id);
    return result;
  }

  listRuns(endpointId, limit = 20) {
    return this._store.listRuns(endpointId, limit);
  }

  getRun(id) {
    return this._store.getRun(id);
  }


  showSiteTab(siteId) {
    const site = this._store.getSite(siteId);
    if (!site) return { success: false, error: `Unknown site "${siteId}"` };
    const tabs = this._tabManager();
    if (!tabs) return { success: false, error: 'The browser is not available.' };
    const tab = SiteApiService.persistedTabFor(tabs, site);
    if (!tab) return { success: false, error: 'No persisted tab for this site is open; open the site and persist the tab.' };
    const shown = typeof tabs.showTab === 'function' ? tabs.showTab(tab.id) : tabs.switchToTab(tab.id);
    return shown && shown.success === false ? shown : { success: true, tabId: tab.id };
  }

  static persistedTabFor(tabs, site) {
    let list;
    try { list = tabs.getPersistedTabs() || []; } catch (_) { return null; }
    for (const tab of list) {
      const entry = typeof tabs.getEntry === 'function' ? tabs.getEntry(tab.id) : null;
      const partition = (entry && entry.partition) || 'persist:main';
      let origin = null;
      try { origin = new URL(tab.url || '').origin; } catch (_) { origin = null; }
      if (partition === site.partition && origin === site.origin) return tab;
    }
    return null;
  }

  static faultResult(fault) {
    return { success: false, fault, advice: Faults.advice(fault) };
  }

  static _endpointSummary(site, endpoint) {
    return {
      ...endpoint,
      toolName: site ? ToolNames.endpointTool(site, endpoint) : null,
      usesLlm: EndpointSpec.usesLlm(endpoint.steps),
    };
  }

  tabManager() {
    return this._tabManager();
  }

  _tabManager() {
    try {
      const manager = this._browser && typeof this._browser.getTabManager === 'function' ? this._browser.getTabManager() : null;
      return manager ? (manager.tabViewManager || null) : null;
    } catch (_) {
      return null;
    }
  }

  _refreshTools() {
    try { if (this._toolHost) this._toolHost.refresh(); } catch (_) {}
  }

  _changed(what, id) {
    try { this._emit('changed', { what, id }); } catch (_) {}
  }
}

module.exports = SiteApiService;
