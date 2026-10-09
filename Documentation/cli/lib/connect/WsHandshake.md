# WsHandshake

`cli/lib/connect/WsHandshake.js`

The HTTP side of opening a WebSocket.

## Methods (static)

- `WsHandshake.newKey()`: 16 random bytes, base64.
- `WsHandshake.acceptFor(key)`: `base64(sha1(key + GUID))`, what the server must echo.
- `WsHandshake.requestHeaders(key, extra)`: `Connection`, `Upgrade`, `Sec-WebSocket-Version: 13`,
  `Sec-WebSocket-Key`, plus the caller's headers.
- `WsHandshake.refusal(statusCode)`: the error for a server that answered without upgrading. 401 is
  `LumaBrowser refused the connection (bad or stale CLI token). Restart the app and try again.`;
  anything else `unexpected HTTP <code> during WebSocket handshake`.
