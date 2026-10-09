# BridgeLink

`cli/lib/BridgeLink.js`

The bridge socket as the small `link` the full-screen [App](tui/session/App.md) consumes, so the app
can run in tests and replays without a socket.

## Methods

- `new BridgeLink(ws)`: `ws` is a [WsClient](connect/WsClient.md) (anything with `sendJson`, `on`, `close`).
- `send(type, payload)`: `ws.sendJson({ type, payload: payload || {} })`.
- `onFrame(fn)`: calls `fn(type, payload)` for each incoming frame that is JSON with a string `type`.
- `onClose(fn)`, `close()`.
- `BridgeLink.parse(raw)`: `{ type, payload }` or `null`; also used by [PlainSession](plain/PlainSession.md).
