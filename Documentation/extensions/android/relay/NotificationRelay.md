# NotificationRelay

`extensions/android/relay/NotificationRelay.js`

Sends the notifications devices raise on to the Personal Hub.

## Methods

- `forward(deviceName, notification)` -> `relayed`, or why not: `off` (the setting), `system` (Android's own notices), `empty`, `no-hub`, `error`.
