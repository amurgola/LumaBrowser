module.exports = {
  id: 'code-mode',
  name: 'Code',
  version: '0.1.1',
  distributable: false,
  description:
    'A coding agent + playground in the LLM chat. Describe what you want and it '
    + 'builds a real, loadable LumaBrowser extension on disk (manifest, main, '
    + 'renderer, UI), validating each file, then installs and activates it live. '
    + 'The base for general in-app coding.',

  dependencies: {
    optional: {
      'core:llm-service': {},
      'core:database': {},
    },
  },

  chatUi: {
    file: './chat-ui.js',
    assets: [
      './code.css',
      './ui/CodeBuildPanel.js', './ui/CodeChatMode.js', './ui/CodeKickoff.js', './ui/CodePanelMarkup.js',
    ],
  },

  routes: { file: './routes.js' },

  main: './main.js',
};
