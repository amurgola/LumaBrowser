# ToolBatchParser

`core/llm-server/agent/ToolBatchParser.js`

Every tool call in one assistant reply, in the order the model wrote them.

## Methods

- `ToolBatchParser.parse(browserTools, content, maxParallel)`: uses
  `browserTools.parseToolCalls` when present (the bridge's adds the loose, XML
  and Harmony recovery paths), else `parseToolCall` for a batch of at most one.
  Non-objects are dropped. `maxParallel <= 1` keeps only the first call, exactly
  what the loop did before batching.
