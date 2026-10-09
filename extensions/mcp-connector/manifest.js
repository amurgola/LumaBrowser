module.exports = {
  id: 'mcp-connector',
  name: 'MCP Connector',
  version: '1.0.0',
  description:
    'Connect to outside MCP servers (stdio / streamable-HTTP / SSE). Their tools '
    + 'are discovered live and merged into LumaBrowser’s own MCP surface and '
    + 'the in-app chat agent tool catalog. No restart needed.',

  dependencies: {
    required: {
      'core:database': {},
    },
  },

  main: './main.js',

  routes: {
    file: './routes.js',
  },

  setupTab: {
    id: 'mcp-connector',
    label: 'MCP Servers',
    file: './setup-ui.js',
    assets: ['./setup-ui.css', './ui/McpServersTab.js', './ui/McpServerCard.js', './ui/McpServerForm.js', './ui/KeyValueLines.js'],
  },
};
