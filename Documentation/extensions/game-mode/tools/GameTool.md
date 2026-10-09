# GameTool

`extensions/game-mode/tools/GameTool.js`

Base class of every Game mode agent tool. A subclass names itself, describes its input and runs; the agent loop gets the plain definition it expects.

## Methods

- Abstract (throw until implemented): `name`, `description`, `inputSchema`, `run(params, opts)`.
- Optional: `sandboxed` (default false; true means confined to the game folder, so AgentChatBridge skips the approval prompt), `onResultEvicted` (default null).
- `toDefinition()` -> `{ name, description, inputSchema, handler(params, opts) }`, plus `sandboxed: true` and `onResultEvicted` only when provided.
