# AiChatAgentFactory

`extensions/ai-chat/AiChatAgentFactory.js`

Builds the core [AgentRunner](../../core/llm-server/agent/AgentRunner.md) the
AI Chat front doors drive.

## Methods

- `AiChatAgentFactory.create(context)` -> `new AgentRunner(context.llm,
  { browserService: context.browser }, context.db.getRawDb())`.
