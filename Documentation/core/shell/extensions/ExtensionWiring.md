# ExtensionWiring

`core/shell/extensions/ExtensionWiring.js`

Plugs an activated extension into the app. Runs after `activate()` so every
surface can reach the activated service.

## Methods

- `new ExtensionWiring({ restGateway, mcpAggregator, setupTabs = SetupTabRegistry.shared, onError })`.
- `wire({ id, manifest, context, api, registry })`:
  1. `manifest.chatModes`: the file exports a descriptor, an array or a factory
     `(context) => either`; each is registered through `context.chat.registerMode`,
     stamped with the `manifest.chatUi` bundle url unless it has its own.
     Failure is recorded as phase `chatModes`.
  2. `manifest.setupTab`: registers `{ id (default extension id), label (default id), url }`.
     Failure is recorded as phase `setupTab`.
  3. `manifest.routes`: `restGateway.registerExtension(id, { factory, prefix }, routeContext)`
     where routeContext is the context plus `extensionApi` and `gateway:
     { registerUpgrade(suffix, handler), port, baseUrl: 'http://127.0.0.1:<port>' }`.
     A missing routes file throws (activation fails).
  4. `context.expose()` routes: `restGateway.mountExposedRoutes(id, router)`.
  5. MCP: the manual tools file (always required, as before) merged with the
     exposed set ([McpToolSetMerger](McpToolSetMerger.md)) and registered with the aggregator.

## UI script loading mode

`ExtensionWiring.isModuleBundle(manifest)` is true for bundled extensions without
`distributable: true`. Their stamped chat UI gets `chatUiModule: true` and their Setup tab
`module: true`, so the LLM tab loads those scripts with `type="module"`. Add-ons
(distributable or user-installed) stay classic scripts.
