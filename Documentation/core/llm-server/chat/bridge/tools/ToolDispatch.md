# ToolDispatch

`core/llm-server/chat/bridge/tools/ToolDispatch.js`

Runs one admitted tool call on whatever owns it.

## Methods

- `new ToolDispatch({ table, toolSet, ctx })`: `ctx` is the run's tool context
  (see [ChatToolHandler](handlers/ChatToolHandler.md)).
- `dispatch(name, params, browserService)`: a built-in handler from the
  [ChatToolTable](ChatToolTable.md); else a mode tool's handler called with
  `(params || {}, { conversationId, assistantMessageId, deps, emit, isAborted,
  artifacts, onArtifact, trace })` (`trace` is the turn's live
  [ToolTrace](../turn/ToolTrace.md), so a mode tool can read what the turn
  already did; a falsy result reads `{ success: true }`); else an
  allowed extension/MCP tool through `mcpAggregator.handleToolCall(name,
  params, { ignoreDisabled: true, emit, onProgress, chat: { conversationId,
  assistantMessageId, onArtifact, isAborted } })` (`isAborted()` reads the
  run's Stop, so a delegation can stop its sub-conversation; `onProgress` is
  [ToolProgress](ToolProgress.md)`.reporter(ctx, name)`, so an MCP server's
  progress notifications tick the card), unwrapped by
  [McpResultUnwrapper](McpResultUnwrapper.md); else `BrowserTools.executeTool`.
  Mode and MCP failures become `<name> failed: <message>`. `emit` and the
  artifact channel go quiet after a Stop.
