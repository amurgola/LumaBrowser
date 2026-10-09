const main = require('./main.js');
const MonitorTools = require('./MonitorTools');

module.exports = {
  tools: MonitorTools.TOOLS,
  handler: (toolName, args = {}) => MonitorTools.handle(main.getApi(), toolName, args),
};
