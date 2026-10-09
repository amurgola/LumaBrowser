# WsClient

`cli/lib/connect/WsClient.js`

A small WebSocket client on Node's `http` module (the package has zero dependencies). An
`EventEmitter`: `message` (a text message), `close`, `error`.

## Methods

- `new WsClient(url, { headers?, timeoutMs = 10000 })`.
- `connect()`: the upgrade request ([WsHandshake](WsHandshake.md)); resolves once the server echoes
  the right `Sec-WebSocket-Accept`. Rejects `WebSocket handshake failed` on a wrong accept, the
  handshake's refusal error on a plain HTTP answer (401: stale token), `WebSocket connect timed out`.
- `send(text)`: one masked text frame; `false` when not connected or closed.
- `sendJson(obj)`.
- `close(code = 1000)`: a close frame, then destroys the socket after `CLOSE_GRACE_MS` (200).
- Fields: `url`, `headers`, `timeoutMs`, `socket`, `closed`.

## Behaviour

Incoming frames ([WsFrameCodec](WsFrameCodec.md)) may span TCP chunks; fragments are joined, a
message over `MAX_MESSAGE_BYTES` (16 MB) is dropped, pings are answered with pongs, a close frame
ends the socket and emits `close`; pongs and binary frames are ignored.
