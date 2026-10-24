# DesktopBroadcast

`extensions/desktop-integration/DesktopBroadcast.js`

Announces a Desktop Integration change to every renderer, like
[HubBroadcast](../personal-hub/HubBroadcast.md): Dashboard widgets and live
modules hear `{ type, payload }` on `ext.desktop-integration.dashboard.event`
([DashboardEventBroadcast](../../core/shell/extensions/DashboardEventBroadcast.md)),
the settings tab hears `{ type, feature, payload }` on
`ext.desktop-integration.changed`. Best-effort; a no-op outside Electron.

## Methods

- `new DesktopBroadcast({ sendDashboard?, sendWindow? })` (test seams).
- `emit(type, payload?, feature?)`: a feature's events are typed `<feature>.<type>`.
- `forFeature(featureId)`: `(type, payload) => emit(type, payload, featureId)`, handed to features as `deps.broadcast`.

The extension itself emits `features.changed`, `token.rotated` and
`clients.changed` (at most every 2 s).
