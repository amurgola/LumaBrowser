const CdpMcpToolSet = require('./CdpMcpToolSet');

const toolSet = {
  tools: CdpMcpToolSet.TOOLS,
  handler: null,
};

toolSet._bind = function _bind(api) {
  toolSet.handler = CdpMcpToolSet.handlerFor(api);
};

module.exports = toolSet;
