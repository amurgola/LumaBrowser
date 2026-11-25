module.exports = {
  id: 'android',
  name: 'Android',
  version: '1.0.0',
  description: 'Run an Android device in a tab: use its apps, let an agent drive it, and get its notifications.',
  dependencies: {
    required: {
      'core:database': {},
      'core:browser': {},
    },
    optional: {
      'ext:personal-hub': {
        reason: 'Send the notifications a device raises to the Hub',
      },
    },
  },
  ui: { 'settings-tab': { label: 'Android', tabId: 'android' } },
  main: './main.js',
  renderer: './renderer.js',
  mcpTools: { file: './mcp-tools.js' },
  routes: { file: './routes.js' },
  distributable: true,
};
