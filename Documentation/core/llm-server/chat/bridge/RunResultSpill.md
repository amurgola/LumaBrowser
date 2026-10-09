# RunResultSpill

`core/llm-server/chat/bridge/RunResultSpill.js`

Builds the spill writer for one agent run: over-budget tool results go to disk
and the model sees a path and a shape sketch.

## Methods (all static)

- `create(router, conversationId, turnId)`: a
  `ToolResultSpill.createWriter({ conversationId, turnId, workspaceRoot })`
  writer, rooted in the conversation's folder when its mode has one
  (`WorkspaceFiles#resolveRoot`, only when the router has a `chatStore`), else
  app-owned. Null without a conversation id or when creation throws.
