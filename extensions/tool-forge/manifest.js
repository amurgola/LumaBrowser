module.exports = {
  id: 'tool-forge',
  name: 'Tool Forge',
  version: '1.0.0',
  private: true,
  description:
    'Lets the AI build new chat tools on request: gather a spec, research the '
    + 'API, write sandboxed JavaScript, test it, and publish it as a reusable '
    + 'tool. Published tools run in a locked-down sandbox with only the network '
    + 'access they declare, and are enabled the moment they are published.',

  dependencies: {
    required: {
      'core:database': {},
    },
    optional: {
      'core:llm-service': {},
    },
  },

  main: './main.js',

  mcpTools: {
    file: './mcp-tools.js',
  },

  setupTab: {
    id: 'tool-forge',
    label: 'My Tools',
    file: './setup-ui.js',
    assets: ['./setup-ui.css', './ui/MyToolsTab.js', './ui/ToolCodeEditor.js', './ui/ToolCompletions.js', './ui/ToolEditView.js', './ui/ToolListView.js', './ui/ToolNotice.js', './ui/ToolSlotEditor.js'],
  },
};
