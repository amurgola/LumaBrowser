# DashboardEventBroadcast

`core/shell/extensions/DashboardEventBroadcast.js`

Best-effort push of an extension's data-change event to every live renderer,
so its Dashboard widgets and live modules refresh without polling.

## Methods (static)

- `channel(extensionId)` -> `ext.<extensionId>.dashboard.event`.
- `send(extensionId, type, payload)`: sends `{ type, payload }` (payload
  `null` when omitted) on that channel to every `webContents` (the Dashboard
  tab, the LLM tab and the shell are all tab views, so
  [RendererBroadcast](RendererBroadcast.md), which only reaches windows, would
  miss them). Destroyed or throwing renderers are skipped; outside an Electron
  main process it is a no-op.

Renderers subscribe through `dashboardAPI.ext.onEvent(extensionId, cb)` and
`liveApi.onExtEvent(extensionId, cb)` (both preloads validate the id, so the
channel name is never page-chosen).
