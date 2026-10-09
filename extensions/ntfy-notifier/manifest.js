module.exports = {
  id: 'ntfy-notifier',
  name: 'Ntfy Notifications',
  version: '1.1.0',
  description: 'Lets the AI agent push notifications to your phone or desktop through an ntfy server (ntfy.sh or self-hosted)',

  dependencies: {
    required: {
      'core:database': {
      },
    },
  },

  ui: {
    'settings-tab': {
      label: 'Ntfy Notifications',
      tabId: 'ntfy-notifier',
    },
  },

  main: './main.js',
  renderer: './renderer.js',

  mcpTools: {
    file: './mcp-tools.js',
  },
};
