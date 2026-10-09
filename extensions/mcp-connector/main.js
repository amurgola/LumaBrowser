const McpConnectorExtension = require('./McpConnectorExtension');

const extension = new McpConnectorExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
};
