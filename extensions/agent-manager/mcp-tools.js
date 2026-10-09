const AgentMcpTools = require('./AgentMcpTools');

const agentTools = new AgentMcpTools();

module.exports = {
  tools: AgentMcpTools.TOOLS,
  handler: (toolName, args, opts) => agentTools.handle(toolName, args, opts),
  setStore: (store) => agentTools.setStore(store),
};
