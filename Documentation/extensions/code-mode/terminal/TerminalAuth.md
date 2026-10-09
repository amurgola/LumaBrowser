# TerminalAuth

`extensions/code-mode/terminal/TerminalAuth.js`

Who may open the terminal bridge.

## Methods (static)

- `authorize(req, handshake)` -> `{ ok: true }` only for a loopback peer
  (`IpClass.isLoopbackIp`, mapped IPv6 included) whose token passes
  `handshake.verify`; else `{ ok: false, reason: 'not loopback' | 'no handshake' | 'bad token' }`.
- `tokenFrom(req)` -> the `token` query parameter, else a `Bearer` header, else `''`.

## Why

WebSocket upgrades bypass the /api middleware, so the bridge checks loopback
and this launch's CLI handshake token itself.
