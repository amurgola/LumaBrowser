# NotificationLog

`ui/shell/notifications/NotificationLog.js`

The floating notification log (`window.addLogEntry`) in the overlay's 'notif' layer: last ten entries, auto-close 5 s after the newest, paused while hovered, lifted above the On Demand tile. An entry can carry a button; the log then stays open until every such entry is acted on or the log is dismissed.

## Methods

- `install()`, `add(message, type, { action: { label, run } }?)`, `render()`, `hide()`, `setHovered(bool)`, `entries`, `visible`. Each entry gets an `id`; `action` puts a button on it (label defaults to "Open").
- `runAction(id)`: runs that entry's action once and clears its button; the log re-renders while another button holds it open, else hides.
- `hide()` also drops every button, so an old alert does not pin the log open under a later message.
- `NotificationLog.place(innerWidth, innerHeight, tile, count)`; `count` is in rows, an entry with a button counting `ACTION_ENTRY_ROWS` (3).

## Globals

Reads `window.chromeOverlayAPI`, `window.ipcBridge.on('on-demand:tile')`.
