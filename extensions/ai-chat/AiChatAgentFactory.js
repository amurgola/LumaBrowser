const AgentRunner = require('../../core/llm-server/agent/AgentRunner');

class AiChatAgentFactory {
  static create(context) {
    return new AgentRunner(context.llm, { browserService: context.browser }, context.db.getRawDb());
  }
}

module.exports = AiChatAgentFactory;
