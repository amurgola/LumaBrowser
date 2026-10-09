# McpClientManager

`extensions/mcp-connector/McpClientManager.js`

Connects to outside MCP servers as a client, discovers their tools, keeps them
registered with the McpAggregator (via [McpToolRegistry](McpToolRegistry.md))
and forwards each namespaced call to the owning server.

## Methods

- `new McpClientManager({ store, logger, transportFactory, createClient, getAggregator })`.
  Seams default to [McpTransportFactory](McpTransportFactory.md), the SDK
  `Client({ name: 'LumaBrowser', version: '1.0.0' }, { capabilities: {} })`, and
  [ChatRouterDeps](ChatRouterDeps.md)`.aggregator()`.
- `connect(config)`: disconnects any previous connection, dials with a 30 s
  timeout on connect and on `listTools`, records `connected` with its tools or
  `error` with the message, re-syncs the aggregator slot. Never throws;
  returns `{ status, error, toolCount }`.
- `disconnect(serverId)`: closes the client (errors ignored) and re-syncs.
- `reconnectAll()`: connects every enabled stored server, sequentially.
- `disconnectAll()`.
- `status()`: per stored server `{ id, name, transport, enabled, status, error,
  tools: [{ name, description }] }`; `idle`/`disabled` when never dialled.
- `callTool(toolName, args)`: the aggregator handler. Rejects
  `mcp-connector: unknown tool "<name>"` and
  `mcp-connector: server for "<name>" is not connected`; otherwise
  `client.callTool({ name: original, arguments }, undefined, { timeout: 120000 })`,
  whose MCP envelope is returned as-is.
- Statics `CONNECT_TIMEOUT_MS` (30000), `CALL_TIMEOUT_MS` (120000).
