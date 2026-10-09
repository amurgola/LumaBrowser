# ChatRouterDeps (mcp-connector)

`extensions/mcp-connector/ChatRouterDeps.js`

Reaches the live McpAggregator through the chat router the LLM server
publishes, read on every call because the router does not exist yet at boot.

## Methods (all static)

- `agentDeps()`: `ExtensionGlobals.chatRouter().getAgentDeps()`, or `{}`.
- `aggregator()`: `agentDeps().mcpAggregator` or null.
