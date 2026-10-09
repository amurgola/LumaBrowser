# DashboardService

`core/dashboard/DashboardService.js`

Owns the Dashboard tab: an internal app page (tab kind `dashboard`, like the
LLM tab's `llm`) where the user arranges live-artifact widgets on a grid. One
tab per window, opened on demand rather than pinned at boot. Layout state is
kept by [DashboardLayout](DashboardLayout.md); this class exposes it.

## Methods

- `new DashboardService({ settingsDb, rootDir? })`; throws without `settingsDb`.
  `rootDir` (default this folder) locates `ui/dashboard.html` and `dashboard-tab-preload.js`.
- `attachTabViewManager(tabViewManager)` late-bound once the window exists.
- `setWebBaseUrl(baseUrl)` points the tab at `<base>/dashboard-ui/dashboard.html`
  (trailing slashes trimmed); an empty base is ignored.
- `getTabId()` the tab id while it is open, else null.
- `ensureTab({ activate = true })` re-activates the open tab, or creates it with
  the dedicated preload and wires [InternalTabLoader](../shell/InternalTabLoader.md).
  Returns the tab id, or null when no tab manager is attached.
- `notifyGatewayReady()` reloads the tab onto the gateway URL unless it is
  already loaded there. Called once the REST gateway is listening.
- `getLayout()`, `setLayout(items)`, `pinWidget(rootId)`, `getHiddenWidgets()`,
  `setWidgetHidden(rootId, hidden)` see DashboardLayout.

## Public fields

- `tabViewManager` read by [DashboardActions](DashboardActions.md).
- `tabHtmlUrl`, `tabHtmlFileUrl`, `tabLoadedOk` the InternalTabLoader host contract.
- `tabHtmlPath`, `tabPreloadPath`.

## Why the gateway

The page is served over the local REST gateway with the `file://` URL only as
a fallback while the gateway binds. The dashboard has no working `file://` mode
(its assets come from `/llm-ui/` and `/dashboard-ui/`), so recovering onto http
in `notifyGatewayReady` matters. The dedicated preload exposes only
`dashboardAPI`, so ordinary tabs cannot reach the dashboard IPC surface.
