module.exports = {
  id: 'cdp-driver',
  name: 'CDP Driver',
  version: '1.0.0',
  description: 'Chrome DevTools Protocol server over WebSocket. Puppeteer, Playwright, chrome-remote-interface, Playwright MCP, and any other CDP client can attach and drive automation-owned LumaBrowser tabs. Failed selectors fall back to LLM resolution when enabled.',

  loadPriority: 80,

  dependencies: {
    required: {
      'core:browser': {
        reason: 'Spawn automation-owned tabs and proxy CDP commands through webContents.debugger.',
      },
      'core:database': {
      },
    },
    optional: {
      'core:llm-service': {
        slots: [
          { id: 'fallback', label: 'Selector Fallback Model', required: false },
        ],
      },
    },
  },

  ui: {
    'settings-tab': {
      label: 'CDP Driver',
      tabId: 'cdp-driver',
    },
  },

  main: './main.js',
  renderer: './renderer.js',

  routes: {
    file: './routes.js',
    prefix: '/api/cdp',
  },

  mcpTools: {
    file: './mcp-tools.js',
  },
};
