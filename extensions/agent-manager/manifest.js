module.exports = {
  id: 'agent-manager',
  name: 'Agent Manager',
  version: '1.0.0',
  description:
    'Build named sub-agents (system prompt + tools + model) and let the main '
    + 'chat agent, or any API or MCP client, can delegate to them like micro-LLMs.',

  dependencies: {
    required: {
      'core:database': {},
    },
    optional: {
      'core:llm-service': {},
    },
  },

  main: './main.js',

  routes: {
    file: './routes.js',
  },

  mcpTools: {
    file: './mcp-tools.js',
  },

  chatUi: { file: './chat-ui.js', assets: ['./ui/AgentChatClient.js', './ui/AgentDirectory.js', './ui/AgentPicker.js'] },

  setupTab: {
    id: 'agent-manager',
    label: 'Agents',
    file: './setup-ui.js',
    assets: ['./setup-ui.css', './ui/AgentsTab.js', './ui/AgentCard.js', './ui/AgentForm.js', './ui/AgentKnowledgeSection.js', './ui/AgentNotice.js'],
  },
};
