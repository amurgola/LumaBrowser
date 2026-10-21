const McpReply = require('./McpReply');
const SiteApiToolHost = require('./SiteApiToolHost');

class SiteApiManagementTools {
  static NOT_ACTIVE = 'Site APIs is not active.';

  static TOOLS = [
    {
      name: 'site_apis_list',
      description: 'List every Site API: each site with its sign-in status and its endpoints (name, tool name, description, params, status, whether a step uses an LLM, last run). Draft endpoints are listed but only validated ones have a siteapi_* tool.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'site_apis_run',
      description: 'Run one Site API endpoint by site id and endpoint name, including drafts that have no tool yet. Answers the endpoint data, or the fault and what to do about it.',
      inputSchema: {
        type: 'object',
        properties: {
          site: { type: 'string', description: 'Site id (from site_apis_list)' },
          endpoint: { type: 'string', description: 'Endpoint name' },
          params: { type: 'object', description: 'Endpoint parameters by name', additionalProperties: true },
        },
        required: ['site', 'endpoint'],
      },
    },
    {
      name: 'site_apis_show_tab',
      description: 'Bring a Site API site\'s persisted tab to the front so the user can sign in again.',
      inputSchema: {
        type: 'object',
        properties: { site: { type: 'string', description: 'Site id' } },
        required: ['site'],
      },
    },
  ];

  static HANDLERS = {
    site_apis_list: (api) => McpReply.ok({ success: true, sites: SiteApiManagementTools._sites(api) }),
    site_apis_run: async (api, args) => SiteApiToolHost.reply(await api.run(String(args.site || ''), String(args.endpoint || ''), args.params || {}, { kind: 'call' })),
    site_apis_show_tab: (api, args) => SiteApiManagementTools._showTab(api, args),
  };

  static async handle(api, toolName, args = {}, opts = {}) {
    if (!api) return McpReply.error(SiteApiManagementTools.NOT_ACTIVE);
    const run = SiteApiManagementTools.HANDLERS[toolName];
    if (!run) return McpReply.error(`Unknown site_apis tool: ${toolName}`);
    try {
      return await run(api, args || {}, opts);
    } catch (err) {
      return McpReply.error(err && err.message ? err.message : String(err));
    }
  }

  static _showTab(api, args) {
    if (!args || !args.site) return McpReply.error('site_apis_show_tab needs "site".');
    const shown = api.showSiteTab(String(args.site));
    return shown && shown.success ? McpReply.ok(shown) : McpReply.fault({ success: false, error: (shown && shown.error) || 'Could not show the tab.' });
  }

  static _sites(api) {
    return api.listSites().map((site) => ({
      id: site.id,
      name: site.name,
      origin: site.origin,
      status: site.status,
      statusNote: site.statusNote || null,
      endpoints: (site.endpoints || []).map(SiteApiManagementTools._endpoint),
    }));
  }

  static _endpoint(endpoint) {
    return {
      name: endpoint.name,
      toolName: endpoint.status === SiteApiToolHost.LIVE_STATUS ? endpoint.toolName : null,
      description: endpoint.description,
      params: endpoint.params,
      returns: endpoint.returns,
      status: endpoint.status,
      usesLlm: !!endpoint.usesLlm,
      lastRun: endpoint.lastRun || null,
    };
  }
}

module.exports = SiteApiManagementTools;
