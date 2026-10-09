module.exports = {
  id: 'tab-share',
  name: 'Tab Share',
  version: '1.0.0',
  description: 'Share a live browser tab with a link. Viewers watch the tab in their own browser; with an interact link they can click and type in it too.',

  dependencies: {
    required: {
      'core:browser': { reason: 'Capture frames from, and inject input into, the shared tab' },
      'core:database': { reason: 'Persist active shares across restarts (keyed to the persisted tab)' },
    },
  },
  private: true,
  distributable: true,
  browserScripts: ['./web/viewer.js'],

  settings: {
    label: 'Tab Share',
    tabId: 'tab-share',
    htmlFile: './settings.html',
  },

  main: './main.js',
  renderer: './renderer.js',
};
