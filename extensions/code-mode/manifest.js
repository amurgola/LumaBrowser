module.exports = {
  id: 'code-mode',
  name: 'Code',
  version: '0.1.1',
  private: true,
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

  extensionsActions: [
    {
      label: 'Vibe',
      variant: 'primary',
      gate: 'llm',
      modeIntent: 'code',
      prompt: {
        title: 'Vibe a new extension',
        subtitle: 'Describe what you want. The Code agent designs, builds, validates, and activates it for you.',
        submitLabel: 'Start building',
        fields: [
          { key: 'task', label: 'What should it do?', type: 'textarea', rows: 4, required: true,
            placeholder: "e.g. Add a 'Reading time' badge to article pages." },
          { key: 'name', label: 'Name (optional)', type: 'text', placeholder: 'Reading Time' },
        ],
      },
    },
    {
      label: 'Code a project',
      variant: 'secondary',
      gate: 'llm',
      modeIntent: 'code',
      prompt: {
        title: 'Work on a project folder',
        subtitle: 'Point the Code agent at a folder on disk. It will read, search, and edit the code there.',
        submitLabel: 'Open project',
        fields: [
          { key: 'projectPath', label: 'Project folder', type: 'text', browse: 'directory', required: true,
            placeholder: 'C:\\Users\\you\\projects\\my-app' },
          { key: 'task', label: 'What should it do?', type: 'textarea', rows: 4, required: true,
            placeholder: 'e.g. Add input validation to the signup form.' },
        ],
      },
    },
  ],

  routes: { file: './routes.js' },

  main: './main.js',
};
