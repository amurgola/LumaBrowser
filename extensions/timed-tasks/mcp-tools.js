const main = require('./main.js');
const TimedTaskTools = require('./TimedTaskTools');

module.exports = {
  tools: TimedTaskTools.TOOLS,
  handler: (toolName, args = {}) => TimedTaskTools.handle(main.getApi(), toolName, args),
};
