const ForgeToolDefinitions = require('./ForgeToolDefinitions');
const ForgeToolHandler = require('./ForgeToolHandler');

module.exports = {
  tools: ForgeToolDefinitions.TOOLS,
  handler: (toolName, args, opts) => ForgeToolHandler.shared.handle(toolName, args, opts),
  setService: (service) => ForgeToolHandler.shared.setService(service),
};
