# SiteApiIpcHandlers

`extensions/site-apis/exposure/SiteApiIpcHandlers.js`

IPC controller of Site APIs. Channels (all `ext.site-apis.*`):

| Channel | Reply |
|---|---|
| `listSites()` | `SiteApiService.listSites()` rows (raw): sites with `endpoints` summaries (`toolName`, `usesLlm`) |
| `getEndpoint(id)` | the endpoint with `toolName` and `usesLlm`, or null (raw) |
| `deleteSite(id)`, `deleteEndpoint(id)` | `{ success: true }` or `{ success: false, error: '... not found' }` |
| `run(siteId, endpointName, params)` | the RunResult (`{ success, data, runId, durationMs, fault?, advice?, healed, stepsLog }`), kind `call` |
| `listRuns(endpointId, limit = 10)` | run rows (raw) |
| `showSiteTab(siteId)` | the service's `{ success, tabId }` or `{ success: false, error }` |
| `openBuilder({ tabId } or { siteId })` | [BuilderLauncher](BuilderLauncher.md)`.open` reply |

The extension itself broadcasts `ext.site-apis.changed { what: 'site' | 'endpoint' | 'run', id }`.

## Methods

- `SiteApiIpcHandlers.register(ipc, service, deps = {})`: `deps.browser` (the extension's `context.browser`) gives
  the launcher its tab lookups; `deps.launcher` injects a ready launcher (tests). Without either, the launcher
  falls back to the TabViewManager the service already holds (`service._tabManager()`). Returns the launcher.
- `SiteApiIpcHandlers.CHANNELS`.
