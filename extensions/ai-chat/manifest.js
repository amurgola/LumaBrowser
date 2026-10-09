module.exports = {
  id: 'ai-chat',
  name: 'AI Chat',
  version: '1.0.0',
  description: 'LLM-driven browser automation with agentic tool execution loop',

  dependencies: {
    required: {
      'core:llm-service': {
        slots: [
          { id: 'navigator', label: 'AI Chat Navigator Model', required: true }
        ]
      },
      'core:browser': {
        reason: 'Navigate tabs, click elements, fill forms, take screenshots',
      },
      'core:database': {
      },
    },
  },

  ui: {
    'right-sidebar': {
      label: 'AI Chat',
    },
    'settings-tab': {
      label: 'AI Chat',
      tabId: 'ai-chat',
    }
  },

  main: './main.js',
  renderer: './renderer.js',

  routes: {
    file: './routes.js',
    prefix: '/api/ai-chat',
  },

  mcpTools: {
    file: './mcp-tools.js',
  },
};
