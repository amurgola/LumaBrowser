module.exports = {
  id: 'notification-interceptor',
  name: 'Notifications',
  version: '1.1.0',
  description: 'Captures web notifications from browser tabs, keeps a log of them, and forwards each one to a webhook',
  loadPriority: 10,

  dependencies: {
    required: {
      'core:browser': {
        reason: 'Inject notification interception into tabs and listen to navigation events',
      },
      'core:database': {
      }
    }
  },

  ui: {
    'settings-tab': {
      label: 'Notifications',
      tabId: 'notifications',
    }
  },

  main: './main.js',
  renderer: './renderer.js',
};
