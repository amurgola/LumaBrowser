# AiChatExtension

`extensions/ai-chat/AiChatExtension.js`

Activates the AI Chat extension: the preferences IPC pair, the headless core
[AgentRunner](../../core/llm-server/agent/AgentRunner.md) behind `ai_chat_run`,
and the `run()` API other extensions use. The side-panel chat itself is a
renderer surface over the unified chat router, not this extension.

## Methods

- `activate(context)` registers `getPreferences` and `savePreferences` on
  `context.ipc` ([AiChatPreferences](AiChatPreferences.md)), builds the runner
  ([AiChatAgentFactory](AiChatAgentFactory.md)), sets `mcp-tools.js`'s
  `handler` to an [AiChatMcpHandler](AiChatMcpHandler.md), and resolves
  `{ run(options) }`. `run` resolves the AgentRunner result and never touches
  conversation history (timed-tasks uses it).
- `deactivate()` drops the runner. There is no in-flight work to abort.

## Entry files

The loader and extension editor find these by name; each is thin.

- `manifest.js`: id `ai-chat`; requires `core:llm-service` (slot `navigator`),
  `core:browser`, `core:database`; `routes` at `/api/ai-chat`; `mcpTools`;
  `renderer.js` (see [renderer](renderer.md)).
- `main.js`: `{ activate, deactivate }` delegating to one AiChatExtension.
- `mcp-tools.js`: `{ tools: [ai_chat_run], handler }`; `handler` is null until
  activation sets it (the loader requires the same cached module).
- `routes.js`: `createRoutes(context)` builds its own runner and serves
  `POST /run`. 400 `{ success: false, error }` for a missing or non-string
  prompt; 500 `{ success: false, error, ...result }` when the run reports an
  error; 500 `{ success: false, error }` when it throws; else
  `{ success: true, ...result }`.

## IPC (renderer contract)

`ext.ai-chat.getPreferences` -> `{ systemPrompt }`;
`ext.ai-chat.savePreferences(preferences)` -> `{ success, error? }`.
