module.exports = {
  id: 'activity-log',
  name: 'Activity Log',
  version: '1.0.0',
  description: 'Universal log of actions performed by extensions and core services. Disabled by default; toggle per-caller to capture the runs you care about.',
  private: true,

  dependencies: {
    required: {
      'core:database': {
        reason: 'Persist the master enable toggle and per-caller overrides in the settings DB.',
      },
    },
  },

  ui: {
    'settings-tab': {
      label: 'Activity Log',
      tabId: 'activity-log',
    },
  },

  main: './main.js',
  renderer: './renderer.js',
};
