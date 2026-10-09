const ExtensionGlobals = require('../../core/shell/extensions/ExtensionGlobals');

class ChatRouterDeps {
  static agentDeps() {
    const router = ExtensionGlobals.chatRouter();
    const deps = router && typeof router.getAgentDeps === 'function' ? router.getAgentDeps() : null;
    return deps || {};
  }

  static aggregator() {
    return ChatRouterDeps.agentDeps().mcpAggregator || null;
  }

  static chatStore() {
    const router = ExtensionGlobals.chatRouter();
    return (router && router.chatStore) || null;
  }
}

module.exports = ChatRouterDeps;
