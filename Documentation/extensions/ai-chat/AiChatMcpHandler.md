# AiChatMcpHandler

`extensions/ai-chat/AiChatMcpHandler.js`

Routes the AI Chat MCP tool calls; set as `mcp-tools.js`'s `handler` on activation.

## Methods

- `new AiChatMcpHandler(runner)`.
- `handle(toolName, args)`: `ai_chat_run` runs
  `AiChatRunRequest.toRunOptions(args, 300000)` and resolves
  `{ content: [{ type: 'text', text: <result as 2-space JSON> }] }`; any other
  name throws `Unknown ai-chat tool: <name>`.

## Why not McpResult.text

`McpResult.text` adds `structuredContent`, which would send a screenshot's
base64 twice; the legacy reply shape (text only) is kept.
