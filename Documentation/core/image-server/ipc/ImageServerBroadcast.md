# ImageServerBroadcast

`core/image-server/ipc/ImageServerBroadcast.js`

Relays the primary image slot's state changes and log lines to every renderer.

## Methods

- `ImageServerBroadcast.wire(runtimeServer)` subscribes to `state-change` and `log`.
- `ImageServerBroadcast.send(type, payload)` sends `{ type, payload }` on `core.imageServer.serverEvent` to every live `webContents`; destroyed or failing ones are skipped.
