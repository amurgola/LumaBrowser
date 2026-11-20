const main = require('./main.js');
const HubTools = require('./HubTools');

module.exports = {
  tools: HubTools.TOOLS,
  handler: async (toolName, args = {}) => HubTools.envelope(await HubTools.handle(main.getApi(), toolName, args)),
};
