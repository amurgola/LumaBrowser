const main = require('./main.js');
const HubTools = require('./HubTools');

module.exports = {
  tools: HubTools.TOOLS,
  handler: (toolName, args = {}) => HubTools.handle(main.getApi(), toolName, args),
};
