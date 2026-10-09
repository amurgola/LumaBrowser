# McpServer

`core/shell/McpServer.js`

The stdio MCP server that external clients (Claude Desktop, LM Studio, ...)
launch via `mcp-server.js`. It proxies tool listing and tool calls to the running
app's REST API (`/api/mcp/tools`, `/api/mcp/call`, served by
[McpProxyRoutes](rest-gateway/McpProxyRoutes.md) over McpAggregator), and starts
the app first if it is not running. Extension MCP tools therefore reach external
clients with no change here.

Built from `mcp-stdio/`: [StdioJsonRpc](mcp-stdio/StdioJsonRpc.md) (transport),
[JsonHttpClient](mcp-stdio/JsonHttpClient.md) (REST calls),
[AppLauncher](mcp-stdio/AppLauncher.md) (auto-start).

## Methods

- `new McpServer(apiBaseUrl?, { input?, output? })`. Default API base is
  `http://$LUMA_API_HOST:$LUMA_API_PORT/api` (127.0.0.1, 3000). Streams default
  to stdin and stdout. Public fields: `apiBase`, `healthUrl`, `apiKey`
  (`$LUMA_API_KEY`, sent as `Authorization: Bearer`), `serverInfo`.
- `start()`: uses a running app or auto-starts one (rejects if it is not up in
  30 s), then reads JSON-RPC from the input.
- `stop()`: stops reading and kills the app only if this server started it.
  Also called automatically when the client closes stdin, after in-flight
  replies are written.
- `handleRequest(method, params)`: `initialize` (echoes a supported protocol
  version, else the newest), `ping`, `tools/list`, `tools/call`; `undefined`
  for anything else (becomes Method not found).
- `listTools()`: `{ tools }`, or `{ tools: [] }` on any failure.
- `callTool(name, args)`: the app's result verbatim; any failure becomes a tool
  result `{ success: false, error }` rather than a protocol error.
- `isElectronRunning()`: `GET /api/health` answered 2xx within 2 s.
- `McpServer.SUPPORTED_PROTOCOL_VERSIONS`: mirrors the MCP SDK, newest first.

## Why

Node built-ins only. The MCP client runs this file with its own `node` out of
`app.asar.unpacked`; a stock Node cannot read `app.asar`, so any npm dependency
(the MCP SDK pulls in zod and ajv) would have to be unpacked with its whole
transitive closure. It must also ship as plain JS, not bytenode, since a stub
needs `bytenode` and the exact V8 that compiled it. The stdio transport is
newline-delimited JSON-RPC, so it is spoken directly.

**Packaging consequence of the split:** every file under `core/shell/mcp-stdio/`
is now loaded by the stdio server, so the build's `asarUnpack` list and the
bytecode compiler's skip list (`scripts/compile-bytecode.js`,
`scripts/_verify-bytecode-asar.js` in legacy) must include them alongside
`core/shell/McpServer.js` and `mcp-server.js`. The test asserts this once
`package.json` has a `build.asarUnpack` section.
