const path = require('path');
const AgentManager = require('./AgentManager');
const AgentFileDialogs = require('./AgentFileDialogs');
const AgentSetupInvoke = require('./AgentSetupInvoke');
const mcpTools = require('./mcp-tools');

let manager = null;

module.exports = {
  async activate(context) {
    manager = new AgentManager(context);
    mcpTools.setStore(manager.store);
    manager.chatMode.sync();
    global.__lumaAgentManager = manager.publicSurface(path.join(__dirname, 'chat-ui.js'));
    const invoke = new AgentSetupInvoke(manager, new AgentFileDialogs(manager));
    if (context.setupTab && typeof context.setupTab.onInvoke === 'function') {
      context.setupTab.onInvoke((action, payload) => {
        if (!manager) throw new Error('Agent store not ready');
        return invoke.handle(action, payload);
      });
    }
    if (context.logger && context.logger.info) context.logger.info('Agent Manager activated');
    return manager.api();
  },

  async deactivate() {
    manager = null;
    delete global.__lumaAgentManager;
  },
};
