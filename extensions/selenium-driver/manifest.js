module.exports = {
  id: 'selenium-driver',
  name: 'Selenium Driver',
  version: '1.0.0',
  description: 'W3C WebDriver and ChromeDriver-compatible HTTP server. Selenium clients drive LumaBrowser tabs directly. Failed selectors fall back to LLM resolution when enabled.',

  loadPriority: 80,

  dependencies: {
    required: {
      'core:browser': {
        reason: 'Drive tabs: navigate, click, fill, screenshot, execute JS.',
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
      label: 'Selenium Driver',
      tabId: 'selenium-driver',
    },
  },

  main: './main.js',
  renderer: './renderer.js',

  routes: {
    file: './routes.js',
    prefix: '/api/selenium',
  },

  mcpTools: {
    file: './mcp-tools.js',
  },
};
