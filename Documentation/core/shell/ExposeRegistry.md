# ExposeRegistry

`core/shell/ExposeRegistry.js`

Collects an extension's `context.expose()` registrations during activation and
turns them into an Express router and an MCP tool set. Extension authors write
plain functions and declare params; no Express, MCP protocol, URLs or ports.

## Methods

- `new ExposeRegistry(extensionId)`; `extensionId` is public.
- `expose(name, fn, { targets = ['api', 'mcp'], description = '', method = 'post', params = {} })`
  records one function. Throws for an empty name, a non-function, or after
  `seal()` (expose must be called synchronously during `activate()`).
- `seal()`: ExtensionManager calls it once activation returns.
- `getRegistrations()`, `hasRegistrations()`.
- `buildMcpToolSet()` returns `{ tools, handler }` for
  `McpAggregator.registerExtension`, or `null` when nothing targets `mcp`. Tool
  names are `<extensionId>_<name>`; the description defaults to
  `<extensionId>: <name>`; params become the input schema via
  [ExposeParams](expose/ExposeParams.md). The handler resolves
  `{ content: [text { success: true, data }] }`, an error result
  `{ success: false, error }` with `isError: true` when the function throws, or
  `null` for a tool name it does not own.
- `buildExpressRouter()` returns a router with one `<METHOD> /<name>` route per
  `api` registration, or `null`. Arguments come from the query (GET, DELETE) or
  body (others), merged with route params, then coerced to declared types. A
  missing required param is `400 { success: false, error: 'Missing required parameters: ...' }`.
  Success is `{ success: true, data, timestamp }`; a thrown error uses its
  `statusCode` (default 500) with `{ success: false, error, timestamp }`.

## Params declaration

`{ [name]: { type = 'string', required?, description?, items?, properties?, enum?, default? } }`

## How it plugs in

ExtensionManager creates one registry per extension, exposes
`context.expose = registry.expose`, seals it after `activate()`, then mounts
`buildExpressRouter()` with `RestGateway.mountExposedRoutes(id, router)` and
registers `buildMcpToolSet()` with `McpAggregator.registerExtension`.
