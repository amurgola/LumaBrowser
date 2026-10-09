const main = require('./main.js');
const WatcherMcpTools = require('./WatcherMcpTools');

module.exports = {
  tools: WatcherMcpTools.TOOLS,
  handler: (toolName, args = {}) => WatcherMcpTools.handle(main.getApi(), toolName, args),
};
