# ToolForgeExtension

`extensions/tool-forge/ToolForgeExtension.js`

Activation wiring of Tool Forge. `main.js` is a thin entry exporting
`{ activate, deactivate }` that delegate to one instance.

## Methods

- `activate(context)`: on `context.db.getRawDb()` builds
  [UserToolStore](UserToolStore.md), [ConfigStore](ConfigStore.md), one
  [LiveApi](../../core/llm-server/chat/LiveApi.md) (`getAgentDeps` from
  [ChatRouterDeps](ChatRouterDeps.md)), the [ToolSandbox](sandbox/ToolSandbox.md)
  (`safeFetch: SafeFetch.fetch`), the [UserToolHost](UserToolHost.md) and the
  [ForgeService](ForgeService.md) (`validator: CodeValidator`,
  `getExistingNames` = `AgentToolCatalog.getAllToolNames(aggregator)` or `[]`,
  `enableTool` = [PublishedToolEnabler](PublishedToolEnabler.md)). Then:
  connects [ForgeToolHandler](ForgeToolHandler.md)`.shared` to the service;
  seeds the builder tools default-off once
  (`AgentToolCatalog.seedDefaultOffAgentTools(rawDb, FORGE_TOOL_NAMES)`);
  registers published tools, retrying every `REGISTER_RETRY_MS` (2000) up to
  `REGISTER_MAX_ATTEMPTS` (60) until the aggregator exists; registers
  [MyToolsSetupActions](MyToolsSetupActions.md) with `context.setupTab.onInvoke`.
  Returns nothing (legacy exposed no API).
- `deactivate()`: stops the retry, disposes the sandbox, unregisters
  `user-tools` from the aggregator, disconnects the builder tools (they answer
  `Tool Forge is not ready yet.`).

## Entry files

- `manifest.js`: same id, fields and text as legacy (`private: true`). The renderer phase added the `ui/` modules to the `assets` lists, because the `/llm-ui/ext/` asset gate serves only declared files and the module entries import them.
- `main.js`: `{ activate, deactivate }`.
- `mcp-tools.js`: `{ tools, handler, setService }` as legacy; `tools` is
  [ForgeToolDefinitions](ForgeToolDefinitions.md)`.TOOLS`, `handler` and
  `setService` go to `ForgeToolHandler.shared`.
- Renderer (see [setup-ui](setup-ui.md), [runner](sandbox/runner.md), [runner-preload](sandbox/runner-preload.md)): `setup-ui.js`, `setup-ui.css`, `sandbox/runner.js`,
  `sandbox/runner-preload.js`, `sandbox/runner.html`. The sandbox loads
  `sandbox/runner-preload.js` and `sandbox/runner.html` by path, so they must
  land beside `sandbox/ToolSandbox.js`. Their contract: preload exposes
  `window.__forge` with `onExec(cb)` (`toolforge:exec`), `result(msg)`
  (`toolforge:result`), `net(msg)` (invoke `toolforge:net`); runner.js must
  keep [ToolCodeExecutor](sandbox/ToolCodeExecutor.md)'s PREAMBLE/EPILOGUE.
