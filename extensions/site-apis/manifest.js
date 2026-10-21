module.exports = {
  id: 'site-apis',
  name: 'Site APIs',
  version: '1.0.0',
  description: 'Turn a signed-in persisted tab into named endpoints: record a step script once, replay it with parameters, get JSON back as an MCP tool, a REST route or a chat tool',

  dependencies: {
    required: {
      'core:database': {
        tables: [
          { name: 'site_api_sites' },
          { name: 'site_api_endpoints' },
          { name: 'site_api_runs' },
        ],
      },
      'core:browser': {
        reason: 'Replay endpoint scripts in a hidden tab that shares the persisted tab\'s session partition',
      },
    },
    optional: {
      'core:llm-service': {
        reason: 'Selector recovery when a site changes, and the optional LLM transform step',
      },
    },
  },

  settings: {
    label: 'Site APIs',
    tabId: 'site-apis',
    htmlFile: './settings.html',
    placement: 'tab',
  },

  main: './main.js',
  renderer: './renderer.js',

  routes: {
    file: './routes.js',
    prefix: '/api/site-apis',
  },

  mcpTools: {
    file: './mcp-tools.js',
  },

  chatModes: {
    file: './chat-modes.js',
  },
};
