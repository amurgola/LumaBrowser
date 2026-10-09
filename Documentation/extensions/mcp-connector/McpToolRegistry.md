# McpToolRegistry

`extensions/mcp-connector/McpToolRegistry.js`

Keeps the single aggregator slot `ext.mcp-connector` equal to the union of
every connected server's tools, and maps each namespaced name back to its
origin.

## Methods

- `new McpToolRegistry({ getAggregator, getConnections, handler })`.
- `sync()`: from connections whose status is `connected`, builds
  `{ name: mcp__<slug>__<tool>, description: '[<slug>] <description or name>', inputSchema (default { type: 'object', properties: {} }) }`
  and calls `registerExtension('mcp-connector', { tools, handler })` (replacing
  the slot), or `unregisterExtension('mcp-connector')` when there are none.
  External MCP clients see the change on their next listing and the chat agent
  on its next turn. Without an aggregator (early boot) it retries once after
  `RETRY_MS` (1500, unref'd timer).
- `route(toolName)`: `{ serverId, originalName }` or null.
