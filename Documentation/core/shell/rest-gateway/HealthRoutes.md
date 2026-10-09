# HealthRoutes

`core/shell/rest-gateway/HealthRoutes.js`

REST controller for the gateway's health and index endpoints. Mounted by
`RestGateway.mountHealthEndpoints` at `/api`.

## Routes

- `GET /api/health` -> `{ status: 'ok', timestamp, port, mcpEnabled, extensions: id[] }`.
  Also used by `McpServer` to detect a running app.
- `GET /api/` -> `{ name: 'LumaBrowser API', port, mcpEnabled, routes: { core, extensions } }`,
  where `core` lists `/api/health`, `/api/browser` (plus the
  two MCP routes when the proxy is mounted) and `extensions` maps id to prefix.

## Methods

- `HealthRoutes.create(readState)` returns the router. `readState()` returns
  `{ port, mcpEnabled, extensions: [{ id, prefix }] }` at request time.
