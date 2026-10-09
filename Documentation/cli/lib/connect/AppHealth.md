# AppHealth

`cli/lib/connect/AppHealth.js`

Tells a live app from a stale handshake file.

## Methods (static)

- `AppHealth.check(port)`: resolves `true` when `GET http://127.0.0.1:<port>/api/health` answers
  200 within `TIMEOUT_MS` (2000); `false` on any error or timeout. Never rejects.
