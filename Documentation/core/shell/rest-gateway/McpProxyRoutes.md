# McpProxyRoutes

`core/shell/rest-gateway/McpProxyRoutes.js`

REST controller the stdio MCP server ([McpServer](../McpServer.md)) proxies
through. Mounted by `RestGateway.mountMcpProxy` at `/api/mcp`.

## Routes

- `GET /api/mcp/tools` -> `{ tools: mcpAggregator.getAllTools() }`; 500
  `{ error }` if listing throws.
- `POST /api/mcp/call` with `{ name, arguments }` -> the tool result verbatim.
  No name: `400 { error: 'Tool name is required' }`. A thrown error becomes
  `{ content }` of an MCP error result, status 503 when the message mentions
  `disabled`, else 400.

## Methods

- `McpProxyRoutes.create(mcpAggregator)` returns the Express router.
