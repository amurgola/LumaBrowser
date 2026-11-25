const AndroidToolSet = require('./tools/AndroidToolSet');
const main = require('./main');

module.exports = {
  tools: AndroidToolSet.TOOLS,
  handler: (toolName, args) => main.getExtension().toolCalls().handle(toolName, args),
};
