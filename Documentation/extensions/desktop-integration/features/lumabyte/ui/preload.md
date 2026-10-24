# ui/preload

`extensions/desktop-integration/features/lumabyte/ui/preload.js`

The sandboxed bridge for the dock and panel pages: `window.lumabyte.call(name,
data)` (invokes `ext.desktop-integration.lumabyte.panel.<name>`),
`dock(action)` (`dock.<action>`), `onEvent(cb)` and `onDock(cb)`. The handlers
answer only Lumabyte's own windows.
