const fs = require('fs');
const path = require('path');

function featureTables() {
  const dir = path.join(__dirname, 'features');
  const names = new Set();
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name, 'tables.js');
      if (!entry.isDirectory() || !fs.existsSync(file)) continue;
      try {
        const list = require(file);
        for (const name of Array.isArray(list) ? list : []) if (/^desktop_[a-z0-9_]+$/.test(String(name))) names.add(String(name));
      } catch (_) {}
    }
  } catch (_) {}
  return [...names].sort().map((name) => ({ name }));
}

module.exports = {
  id: 'desktop-integration',
  name: 'Desktop Integration',
  version: '1.0.0',
  description: 'A local API for desktop clients (taskbar and shell mods, AutoHotkey, PowerToys, scripts): push notifications, glance summaries, open links, hand content to the chat',

  dependencies: {
    required: {
      'core:database': {
        tables: featureTables(),
      },
    },
    optional: {
      'core:browser': {
        reason: 'Bring the main window to the front and open links and searches in a tab',
      },
      'core:llm-service': {
        reason: 'Features that ask the configured model for a summary',
      },
      'ext:personal-hub': {
        reason: 'Glance summaries and notification routing read and feed the Hub',
      },
      'ext:notification-interceptor': {
        reason: 'Desktop notifications join the intercepted notification log',
      },
      'ext:timed-tasks': {
        reason: 'Glance and job features read scheduled task runs',
      },
      'ext:ai-chat': {
        reason: 'Features that run a headless agent turn',
      },
    },
  },

  ui: {
    'settings-tab': {
      label: 'Desktop Integration',
      tabId: 'desktop-integration',
    },
  },

  main: './main.js',
  renderer: './renderer.js',

  routes: {
    file: './routes.js',
    prefix: '/api/desktop',
  },
};
