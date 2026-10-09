# NotificationLog

`ui/shell/notifications/NotificationLog.js`

The floating notification log (`window.addLogEntry`) in the overlay's 'notif' layer: last ten entries, auto-close 5 s after the newest, paused while hovered, lifted above the On Demand tile.

## Methods

- `install()`, `add(message, type)`, `render()`, `hide()`, `setHovered(bool)`, `entries`, `visible`.
- `NotificationLog.place(innerWidth, innerHeight, tile, count)`.

## Globals

Reads `window.chromeOverlayAPI`, `window.ipcBridge.on('on-demand:tile')`.
