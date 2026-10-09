module.exports = {
  id: 'network-watcher',
  name: 'Network Watcher',
  version: '1.0.0',
  description: 'Capture HTTP responses that match a URL pattern and forward them to a webhook',

  dependencies: {
    required: {
      'core:browser': {
        reason: 'CDP attachment for network interception',
      },
      'core:database': {
        tables: [
          {
            name: 'network_watchers',
          }
        ]
      }
    }
  },

  ui: {
    'settings-tab': {
      label: 'Network Watcher',
      tabId: 'watchers',
    }
  },

  main: './main.js',
  renderer: './renderer.js',

  routes: {
    file: './routes.js',
    prefix: '/api/watchers',
  },

  mcpTools: {
    file: './mcp-tools.js',
  },
};
