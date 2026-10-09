const ExtensionAutocompleteData = require('../ExtensionAutocompleteData');

class CapabilitiesSnapshot {
  static CORE_DEPENDENCY_KEYS = { browser: 'core:browser', database: 'core:database', llm: 'core:llm-service' };
  static SURFACE_FIELDS = ['renderer', 'routes', 'mcpTools', 'chatModes', 'chatUi', 'setupTab', 'ui'];

  constructor({ coreServices, mcpAggregator, restGateway, ledger }) {
    this._coreServices = coreServices;
    this._mcpAggregator = mcpAggregator || null;
    this._restGateway = restGateway || null;
    this._ledger = ledger;
  }

  build(excludeId = null) {
    return {
      coreServices: this._presentCoreServices(),
      extensions: this._extensions(excludeId),
      ...CapabilitiesSnapshot._catalog(),
    };
  }

  _presentCoreServices() {
    return Object.entries(CapabilitiesSnapshot.CORE_DEPENDENCY_KEYS)
      .filter(([serviceKey]) => !!(this._coreServices && this._coreServices[serviceKey]))
      .map(([, depKey]) => depKey);
  }

  _extensions(excludeId) {
    const toolsBySource = this._toolsBySource();
    const routeGroupIds = this._routeGroupIds();
    const rows = [];
    for (const [id, ext] of this._ledger.extensions) {
      if (id !== excludeId) rows.push(CapabilitiesSnapshot._row(id, ext, toolsBySource, routeGroupIds));
    }
    return rows.sort((a, b) => a.id.localeCompare(b.id));
  }

  static _row(id, ext, toolsBySource, routeGroupIds) {
    const manifest = ext.manifest || {};
    return {
      id,
      name: manifest.name || id,
      description: manifest.description || '',
      api: ext.api && typeof ext.api === 'object' ? Object.keys(ext.api) : [],
      tools: toolsBySource[`ext.${id}`] || [],
      hasRoutes: routeGroupIds.has(`ext.${id}`),
      surfaces: CapabilitiesSnapshot.SURFACE_FIELDS.filter((field) => manifest[field]),
    };
  }

  _toolsBySource() {
    const bySource = {};
    try {
      if (!this._mcpAggregator || !this._mcpAggregator.getRegisteredTools) return bySource;
      for (const tool of this._mcpAggregator.getRegisteredTools()) (bySource[tool.source] = bySource[tool.source] || []).push(tool.name);
    } catch (_) {}
    return bySource;
  }

  _routeGroupIds() {
    const ids = new Set();
    try {
      if (this._restGateway && this._restGateway.getRouteGroups) for (const group of this._restGateway.getRouteGroups()) ids.add(group.id);
    } catch (_) {}
    return ids;
  }

  static _catalog() {
    return {
      contextApi: (ExtensionAutocompleteData.CONTEXT_PROPERTIES || []).map((p) => ({ name: p.label, detail: p.detail, doc: p.documentation })),
      manifestFields: (ExtensionAutocompleteData.MANIFEST_FIELDS || []).map((f) => ({ name: f.label, detail: f.detail })),
    };
  }
}

module.exports = CapabilitiesSnapshot;
