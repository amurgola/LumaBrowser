module.exports = {
  id: 'roleplay-mode',
  name: 'Roleplay Mode',
  version: '1.1.0',
  description:
    'Adds an interactive scene-and-character roleplay mode to the LLM chat: '
    + 'scenarios, characters with generated/uploaded avatars, navigable scene '
    + 'backgrounds, and auto-generated images with character responses.',

  private: true,
  distributable: true,

  dependencies: {
    optional: {
      'core:llm-service': {},
      'core:database': {},
    },
  },

  chatUi: { file: './chat-ui.js', assets: ['./roleplay.css', './rp-lab.js', './shared.js'] },

  settings: { label: 'Roleplay', tabId: 'roleplay-mode', htmlFile: './settings.html' },

  main: './main.js',
  renderer: './renderer.js',
};
