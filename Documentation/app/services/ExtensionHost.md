# ExtensionHost

`app/services/ExtensionHost.js`

Builds the [ExtensionManager](../../core/shell/ExtensionManager.md) and the
coreServices map extensions receive as `context.sharedServices`.

## Methods

- `new ExtensionHost(ctx)`; `build()` adds `extensionManager` over
  `<root>/extensions` and `<dataDir>/extensions`, with the IPC bridge, REST
  gateway and MCP aggregator.
- `ExtensionHost.coreServices(services)` returns `{ database, llm, browser: null,
  identity, chromeExtensions, adblocker, networkWatcherService,
  networkInterceptor, activityLog, ttsServer, sttServer }`. `browser` is filled
  in by [WindowServices](../browser/WindowServices.md) once the window exists.
