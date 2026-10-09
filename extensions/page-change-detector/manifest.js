module.exports = {
  id: 'page-change-detector',
  name: 'Page Monitors',
  version: '1.1.0',
  description: 'Watch web pages, or chosen elements on them, and get a desktop notification or webhook when the content changes',
  loadPriority: 50,

  dependencies: {
    required: {
      'core:database': {
        tables: [
          { name: 'page_change_monitors' },
          { name: 'page_change_history' },
        ],
      },
      'core:browser': {
        reason: 'Need tab management and text extraction for page monitoring',
      },
    },
  },

  navigationBar: {
    label: 'Page Monitors',
    tooltip: 'Page Monitors',
    icon: 'bell',
    panel: {
      location: 'right-panel',
      htmlFile: './panel.html',
    },
  },

  settings: {
    label: 'Page Monitors',
    tabId: 'page-change-detector',
    htmlFile: './settings.html',
  },

  main: './main.js',
  renderer: './renderer.js',

  routes: {
    file: './routes.js',
    prefix: '/api/page-change-detector',
  },

  mcpTools: {
    file: './mcp-tools.js',
  },
};
