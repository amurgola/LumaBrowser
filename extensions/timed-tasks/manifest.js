module.exports = {
  id: 'timed-tasks',
  name: 'Timed Tasks',
  version: '1.1.0',
  description: 'Schedule recurring AI tasks with a prompt, an optional response schema, and an optional webhook for results',

  dependencies: {
    required: {
      'core:database': {
        tables: [
          { name: 'timed_tasks' },
          { name: 'timed_task_runs' }
        ]
      },
      'ext:ai-chat': {
        reason: 'Delegate agentic task execution to the shared AgentRunner',
      }
    }
  },

  navigationBar: {
    label: 'Timed Tasks',
    tooltip: 'Timed Tasks',
    icon: 'clock',
    panel: {
      location: 'right-panel',
      htmlFile: './panel.html',
    }
  },

  settings: {
    label: 'Timed Tasks',
    tabId: 'timed-tasks',
    htmlFile: './settings.html',
  },

  main: './main.js',
  renderer: './renderer.js',

  routes: {
    file: './routes.js',
    prefix: '/api/timed-tasks',
  },

  mcpTools: {
    file: './mcp-tools.js',
  },
};
