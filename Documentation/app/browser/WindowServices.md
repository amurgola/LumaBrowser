# WindowServices

`app/browser/WindowServices.js`

Wires everything that needs the main window, once per window.

## Methods

- `new WindowServices(ctx, { log? })`.
- `wire(win)`:
  1. [TabSurfaces](TabSurfaces.md) (tabs, overlays, preview, On Demand);
  2. [HistoryRecorder](HistoryRecorder.md);
  3. [AutomationServices](AutomationServices.md) (selector fallback, REST
     browser/health routes, BrowserService, grounding, desktop);
  4. the gateway pages: [StaticUiRoutes](../gateway/StaticUiRoutes.md) then
     [ArtifactRoutes](../gateway/ArtifactRoutes.md), both behind
     `apiSecurity.middleware()`;
  5. [CoreMcpTools](CoreMcpTools.md) (and the MCP proxy, disabled API groups);
  6. `extensionManager.coreServices.browser = browserService`, `discover()`,
     `resolve()` (so the setup wizard can list extensions);
  7. exposes the heavy phase as `ctx.heavyServices` ([HeavyServices](../ready/HeavyServices.md));
     it runs only from [DeferredServices](../ready/DeferredServices.md).
