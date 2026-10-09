# ForgeToolHandler

`extensions/tool-forge/ForgeToolHandler.js`

Routes builder tool calls to the [ForgeService](ForgeService.md) and wraps
every reply in the MCP envelope ([McpEnvelope](McpEnvelope.md), `isError` =
`!success`).

## Methods

- `ForgeToolHandler.shared`: the instance `mcp-tools.js` (loaded by the
  extension wiring) and [ToolForgeExtension](ToolForgeExtension.md) share.
- `setService(service)`: null on deactivate.
- `handle(toolName, args, opts)`: `create_tool` -> `createTool(args)`,
  `test_tool` -> `testTool(args)`, `publish_tool` ->
  `publishTool(args, { conversationId: opts.chat.conversationId || null })`
  (the chat bridge sets `opts.chat`; external MCP callers get the global enable
  only). Without a service: `Tool Forge is not ready yet.`; an unknown tool:
  `Unknown tool-forge tool: <name>`; a throw becomes `{ success: false, error }`.
