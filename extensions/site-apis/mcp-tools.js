const main = require('./main.js');
const SiteApiManagementTools = require('./exposure/SiteApiManagementTools');

module.exports = {
  tools: SiteApiManagementTools.TOOLS,
  handler: (toolName, args = {}, opts = {}) => SiteApiManagementTools.handle(main.getApi(), toolName, args, opts),
};
