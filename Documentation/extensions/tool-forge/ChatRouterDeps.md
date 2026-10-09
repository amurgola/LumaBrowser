# ChatRouterDeps (tool-forge)

`extensions/tool-forge/ChatRouterDeps.js`

Reaches the chat router the LLM server publishes, read on every call because
the router does not exist yet when the extension activates at boot.

## Methods (all static)

- `agentDeps()`: `ExtensionGlobals.chatRouter().getAgentDeps()`, or `{}`.
- `aggregator()`: `agentDeps().mcpAggregator` or null.
- `chatStore()`: the router's `chatStore` or null.
