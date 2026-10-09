# GrantableTools

`extensions/agent-manager/GrantableTools.js`

The tools an agent may be granted.

## Methods (static)

- `groups(router = ExtensionGlobals.chatRouter())` ->
  [AgentToolCatalog](../../core/llm-service/AgentToolCatalog.md)`.getToolGroups(router.getAgentDeps().mcpAggregator)`
  minus the `ext.agent-manager` group (an agent must never get chat_with_agent);
  `[]` until the router publishes its aggregator.
- `availableNames(router)` -> a Set of `BASE_TOOL_NAMES` plus every name in `groups`.
