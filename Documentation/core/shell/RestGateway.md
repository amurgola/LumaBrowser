# RestGateway

`core/shell/RestGateway.js`

The app's local HTTP server. Core routes, extension routes, the MCP proxy,
health endpoints and WebSocket upgrades all ride one Express listener, behind
CORS, body parsers and (optionally) ApiSecurity on `/api`.

Thin facade over `rest-gateway/`:
[ExtensionRouteTable](rest-gateway/ExtensionRouteTable.md),
[UpgradeRouter](rest-gateway/UpgradeRouter.md),
[McpProxyRoutes](rest-gateway/McpProxyRoutes.md),
[HealthRoutes](rest-gateway/HealthRoutes.md).

## Methods

- `new RestGateway(port = 3000, { apiSecurity?, rawBodyPrefixes? })`.
  `apiSecurity.middleware()` is mounted on `/api` before every route. Paths equal
  to or under a raw-body prefix skip the JSON (50 MB limit) and urlencoded
  parsers. Public fields: `port`, `app`, `server`.
- `mountCore(prefix, router)`: core routes, no gate.
- `registerExtension(extensionId, factoryOrConfig, context)`: mounts an
  extension's manual routes. `factoryOrConfig` is a factory
  `(context) => router`, a ready Express router, or `{ factory, prefix }` from
  the manifest. Prefix is the custom one, else `/api/ext/<extensionId>`.
  Failures are logged, never thrown.
- `mountExposedRoutes(extensionId, router)`: mounts `context.expose()` routes at
  the extension's recorded prefix (or the default).
- `disableExtension(id)` / `enableExtension(id)`: a disabled extension's HTTP
  routes answer `503 { error: 'Extension disabled', extensionId }` and its
  upgrades are destroyed.
- `mountMcpProxy(mcpAggregator)`: `GET /api/mcp/tools`, `POST /api/mcp/call`.
- `mountHealthEndpoints()`: `GET /api/health`, `GET /api/`.
- `getRouteGroups()`: `[{ id, label, prefix, source }]`, `core.browser` first,
  then `ext.<id>` per registered extension (settings UI toggles).
- `registerExtensionUpgrade(extensionId, suffix, handler)`: WebSocket handler
  for `/api/ext/<id><suffix>`; works before or after `start()`.
- `removeExtensionUpgrades(extensionId)`: deactivation.
- `start()`: listens on `0.0.0.0:<port>`; resolves when listening, rejects on
  a server error.
- `stop()`: closes the server and force-closes open connections.
- `getApp()`: the Express app, for callers that mount directly.

## Mapping for callers (how controllers plug in)

| To expose | Call | Lands at |
|---|---|---|
| core service routes | `restGateway.mountCore('/api/browser', router)` | `/api/browser/*` |
| extension `routes.js` | `restGateway.registerExtension(id, { factory, prefix }, routeContext)` | `prefix` or `/api/ext/<id>/*`, gated |
| extension `context.expose()` | `restGateway.mountExposedRoutes(id, exposeRegistry.buildExpressRouter())` | same prefix as above, gated |
| extension WebSocket | `routeContext.gateway.registerUpgrade(suffix, handler)` which calls `restGateway.registerExtensionUpgrade(id, suffix, handler)` | `/api/ext/<id><suffix>` |
| MCP tools to stdio clients | `restGateway.mountMcpProxy(mcpAggregator)` | `/api/mcp/tools`, `/api/mcp/call` |
| raw request bodies (webhooks) | `new RestGateway(port, { rawBodyPrefixes: ['/hooks'] })` then `getApp().use('/hooks', router)` | `/hooks/*`, unparsed |

## Why

Upgrade requests bypass Express (Node emits `upgrade`, not `request`), so
ApiSecurity never sees them; each upgrade handler owns its own auth (usually a
`?token=` query, since browsers cannot set headers on `new WebSocket()`).
Manual and exposed routes share one gate so disabling an extension closes both
by construction. `stop()` force-closes connections because keep-alive and MCP
clients can hold sockets open forever and would hang app quit.
