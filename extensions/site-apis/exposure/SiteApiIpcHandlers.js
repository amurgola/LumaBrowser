const IpcEnvelope = require('../../../core/shared/ipc/IpcEnvelope');
const ToolNames = require('../spec/ToolNames');
const EndpointSpec = require('../spec/EndpointSpec');
const BuilderLauncher = require('./BuilderLauncher');

class SiteApiIpcHandlers {
  static CHANNELS = Object.freeze(['listSites', 'getEndpoint', 'deleteSite', 'deleteEndpoint', 'run', 'listRuns', 'showSiteTab', 'openBuilder']);
  static DEFAULT_RUN_LIMIT = 10;

  static register(ipc, service, deps = {}) {
    const launcher = deps.launcher || new BuilderLauncher({ service, getTabs: () => SiteApiIpcHandlers._tabs(service, deps.browser) });
    ipc.handle('listSites', async () => service.listSites());
    ipc.handle('getEndpoint', async (_event, id) => SiteApiIpcHandlers._endpoint(service, id));
    ipc.handle('deleteSite', IpcEnvelope.enveloped((_event, id) => SiteApiIpcHandlers._removed(service.deleteSite(id), 'Site not found')));
    ipc.handle('deleteEndpoint', IpcEnvelope.enveloped((_event, id) => SiteApiIpcHandlers._removed(service.deleteEndpoint(id), 'Endpoint not found')));
    ipc.handle('run', IpcEnvelope.enveloped((_event, siteId, endpointName, params) => service.run(siteId, endpointName, params || {}, { kind: 'call' })));
    ipc.handle('listRuns', async (_event, endpointId, limit) => service.listRuns(endpointId, Number(limit) || SiteApiIpcHandlers.DEFAULT_RUN_LIMIT));
    ipc.handle('showSiteTab', IpcEnvelope.enveloped((_event, siteId) => service.showSiteTab(siteId)));
    ipc.handle('openBuilder', IpcEnvelope.enveloped((_event, input) => launcher.open(input || {})));
    return launcher;
  }

  static _endpoint(service, id) {
    const endpoint = service.getEndpoint(id);
    if (!endpoint) return null;
    const site = service.getSite(endpoint.siteId);
    return { ...endpoint, toolName: site ? ToolNames.endpointTool(site, endpoint) : null, usesLlm: EndpointSpec.usesLlm(endpoint.steps) };
  }

  static _removed(removed, notFound) {
    return removed ? { success: true } : { success: false, error: notFound };
  }

  static _tabs(service, browser) {
    try {
      if (browser && typeof browser.getTabManager === 'function') {
        const manager = browser.getTabManager();
        return manager ? (manager.tabViewManager || null) : null;
      }
      return typeof service.tabManager === 'function' ? service.tabManager() : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = SiteApiIpcHandlers;
