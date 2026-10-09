const NtfyMcpTools = require('./NtfyMcpTools');

const instance = new NtfyMcpTools();

module.exports = {
  tools: NtfyMcpTools.TOOLS,
  handler: (toolName, args) => instance.handle(toolName, args),
  configure: (options) => instance.configure(options),
};
