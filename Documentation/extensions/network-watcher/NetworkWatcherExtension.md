# NetworkWatcherExtension

`extensions/network-watcher/NetworkWatcherExtension.js`

Main-process side of the Network Watcher extension: CRUD, REST and IPC on top
of the core [NetworkWatcherService](../../core/network-watcher/NetworkWatcherService.md),
the same instance the core NetworkInterceptor writes captures to.

## Methods

- `activate(context)`: takes `context.sharedServices.networkWatcherService`
  (throws `network-watcher: core networkWatcherService not available, cannot
  activate` without it), registers [WatcherIpcHandlers](WatcherIpcHandlers.md)
  and resolves `{ getWatcherService(), getAllWatchers(), getStats() }`.
- `getApi()`: that API while active, `null` otherwise (how `mcp-tools.js`
  reaches the running instance).
- `deactivate()`: drops the references.

## Entry files

- `manifest.js`: id `network-watcher`, requires `core:browser` and
  `core:database` with table `network_watchers`, settings tab `watchers`,
  routes at the original `/api/watchers`, `mcpTools`.
- `main.js`: `{ activate, deactivate, getApi }` delegating to one instance.
- `routes.js`: the REST controller (list, create, stats, test, get, patch,
  delete, toggle, last-response), shapes unchanged. `POST /test` runs a
  [WatcherTestRun](WatcherTestRun.md) with the `api` sample. Request-shape
  checks come from [WatcherInput](WatcherInput.md).
- `mcp-tools.js`: `{ tools, handler }` from [WatcherMcpTools](WatcherMcpTools.md):
  `watcher_list`, `watcher_add` (mutating), `watcher_remove` (mutating),
  `watcher_toggle` (mutating). Legacy exported `handler: null` (listed but not
  callable); the owner decided to wire them up as real agent tools.
- `renderer.js`: module entry (loaded by the shell as `type="module"`) that sets
  `window.__ext_network_watcher` over [ui/NetworkWatcherTab](ui/NetworkWatcherTab.md).

## Security

Header redaction is not done here: every capture this extension sends (the
test runs) goes through `NetworkWatcherService.forwardToWebhook`, the
[HeaderRedactor](../../core/network-watcher/HeaderRedactor.md) choke point.
The agent tools additionally re-redact any stored capture they return (see
[WatcherMcpTools](WatcherMcpTools.md)).
