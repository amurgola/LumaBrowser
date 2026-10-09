# HubBroadcast

`extensions/personal-hub/HubBroadcast.js`

Announces a Hub change to every renderer. One `emit(type, payload)` reaches
the Dashboard widgets and live modules on the extension's dashboard event
channel (`ext.personal-hub.dashboard.event`, through
[DashboardEventBroadcast](../../core/shell/extensions/DashboardEventBroadcast.md))
and the settings tab on `ext.personal-hub.changed` (through
[RendererBroadcast](../../core/shell/extensions/RendererBroadcast.md)).

## Methods

- `new HubBroadcast({ sendDashboard?, sendWindow? })`: test seams.
- `emit(type, payload = {})`: both sends, each best-effort.
- `emitter()`: the `(type, payload)` function the services take.

## Event types

`calendar.synced`, `calendar.changed`, `thread.changed`, `task.changed`,
`board.changed`, `sync.status`.
