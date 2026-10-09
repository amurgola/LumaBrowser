const SeleniumMcpToolSet = require('./SeleniumMcpToolSet');

const toolSet = {
  tools: SeleniumMcpToolSet.TOOLS,
  handler: null,
};

toolSet._bind = function _bind(api) {
  toolSet.handler = SeleniumMcpToolSet.handlerFor(api);
};

module.exports = toolSet;
