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
  networkInterceptor, activityLog, ttsServer, sttServer, apiSecurity, dashboard }`.
  `apiSecurity` is the app's single [ApiSecurity](../../core/shell/ApiSecurity.md);
  cdp-driver and selenium-driver check its keys when bound off loopback. `browser` is filled
  in by [WindowServices](../browser/WindowServices.md) once the window exists.
  `dashboard` is a getter that reads the
  [DashboardService](../../core/dashboard/DashboardService.md) live (it is built
  later, by GatewayServices), or null; extensions use `ensureTab({ activate })`
  to open the Dashboard tab.
