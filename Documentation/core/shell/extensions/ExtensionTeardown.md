# ExtensionTeardown

`core/shell/extensions/ExtensionTeardown.js`

Undoes everything an active extension plugged into the app.

## Methods

- `ExtensionTeardown.sharedRegistries()` -> `{ chatModes, setupTabs, imageCatalog,
  runtimeCatalog, modelCatalog, ttsEngines }`, the process-wide registries (the
  manager's default; tests pass fresh ones).
- `new ExtensionTeardown({ coreServices, ipcBridge, mcpAggregator, restGateway, registries })`.
- `teardown(id, { manifest, instance })`: runs `deactivate()`, then unregisters
  its LLM slots, IPC channels, MCP tools, chat modes, Setup tab and invoke
  handler, image catalog rows, add-on models, runtimes (dropping the runtimes
  view when any were removed), TTS engines, and finally disables its REST routes
  and removes its WebSocket upgrades.
- `ExtensionTeardown.runDeactivate(id, instance)` resolves true when
  `deactivate()` ran cleanly, false when absent or it threw (logged).
