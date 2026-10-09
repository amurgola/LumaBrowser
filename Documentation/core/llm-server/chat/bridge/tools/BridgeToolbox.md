# BridgeToolbox

`core/llm-server/chat/bridge/tools/BridgeToolbox.js`

The `browserTools` the bridge hands AgentRunner.

## Methods

- `new BridgeToolbox({ parser, guard })`.
- `TOOL_DEFINITIONS`, `getToolPrompt(toolNames)`: from `BrowserTools`.
- `parseToolCall(content)`, `parseToolCalls(content)`: the run's
  [RunToolCallParser](../parsing/RunToolCallParser.md).
- `executeTool(name, params, browserService)`: through
  [TruncationGuard](TruncationGuard.md).
