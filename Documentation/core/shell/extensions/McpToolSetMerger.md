# McpToolSetMerger

`core/shell/extensions/McpToolSetMerger.js`

Combines an extension's manual MCP tool set (`manifest.mcpTools`) with the one
built from `context.expose()`.

## Methods

- `McpToolSetMerger.merge(manual, exposed)` the set that exists, null for
  neither, or `{ tools: [...manual, ...exposed], handler(toolName, args, opts) }`
  routing exposed names to the exposed handler and the rest to the manual one.
  `opts` (e.g. `opts.emit`, the sub-agent live stream) is forwarded untouched.
