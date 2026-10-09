# HubRenderer

`extensions/personal-hub/ui/HubRenderer.js`

The Hub extension in the main window: the [HubSettingsTab](HubSettingsTab.md),
and the board's sync errors shown in the browser's notification log (bottom
right). The Dashboard widgets are separate modules the Dashboard page loads
from the manifest, so nothing of theirs runs in the shell.

## Methods

- `new HubRenderer({ win? })`: `win` is the window holding `addLogEntry` (a
  test seam; default the global `window`).
- `activate(context)`: deactivates a previous activation, listens on
  `ext.personal-hub.changed` through `context.ipcBridge`, then activates the
  settings tab with the shell's context (`{ ipcBridge, slotManager,
  browserRenderer }`).
- `deactivate()`: detaches the listener and tears the tab down.

## Sync errors

A `board.error` event (`{ taskId, title, sourceLabel, message }`, see
[BoardService](../board/BoardService.md)) becomes
`window.addLogEntry('<source>: <task>: <message>', 'error')`; the source and
task parts are left out when empty. Nothing happens without a message or
without `addLogEntry`.

## Signed-out tabs

A `connection.alert` event (`{ key, title, message }`, see
[ConnectionMonitor](../connections/ConnectionMonitor.md)) becomes
`window.addLogEntry('Hub: <title>', 'error')`, next to the desktop alert the
main process shows.

## Globals

None directly; the entry `renderer.js` writes `window.__ext_personal_hub`.
