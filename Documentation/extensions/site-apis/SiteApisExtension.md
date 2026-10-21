# SiteApisExtension

`extensions/site-apis/SiteApisExtension.js`

Activates Site APIs: `SiteApiSchema.ensure`, the store, the `EndpointRunner` (with `onSiteStatus` writing the
site status and broadcasting, and `showSiteTab` for the sign-in notification), the `SiteApiToolHost` (re-registered
through the chat router's MCP aggregator, read late because the router starts after extensions), the
`SiteApiService`, the `SiteApiBuilderMode`, and the IPC channels. The service is the API `main.js getApi()`
publishes; `builderDescriptor()` is what `chat-modes.js` registers.

## Methods

- `activate(context)`, `deactivate()`, `getApi()`, `builderDescriptor()`.
- Constructor `overrides: { runner, toolHost, builder }` for tests.

## Entry files

- `main.js`: the manifest entry delegating to one instance.
- `manifest.js`: tables, browser and (optional) LLM dependencies, the Settings tab, routes at `/api/site-apis`,
  `mcp-tools.js` (management tools) and `chat-modes.js` (the builder mode).
- `mcp-tools.js`: `SiteApiManagementTools` over `getApi()`.
- `chat-modes.js`: a factory answering the builder descriptor (or nothing while inactive).
- `ChatRouterDeps.js`: late-bound access to the chat router's MCP aggregator and chat store.
