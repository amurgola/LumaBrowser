# SharingListener

`core/network-sharing/host/SharingListener.js`

Base class for the network listeners the sharing host owns:
[TlsSharingServer](TlsSharingServer.md) and [WebAppServer](../webapp/WebAppServer.md).
It owns the start, restart and stop lifecycle so the two cannot drift.

## Methods

- `isRunning()`, `getPort()` (the bound port, or null).
- `start(port)` stops a running server first, then binds `0.0.0.0:port`. Resolves
  `{ success: true, port, ...extra }` (port 0 reports the real ephemeral port)
  or `{ success: false, error }`. Never rejects.
- `stop()` resolves `{ success: true }`, also when nothing runs. It calls
  `closeAllConnections()` after `close()`, because a client mid-stream (SSE chat,
  a pinned keep-alive peer) would otherwise stall `close()` forever, hanging the
  sharing toggle, a port change and app quit.
- `SharingListener.BIND_HOST` (`'0.0.0.0'`).

## Subclass hooks

| Hook | Contract |
|---|---|
| `_createServer()` | Returns the http(s) server. A throw resolves `start` with `{ success: false, error: err.message }`. |
| `_logName()` | Short name for `[sharing] <name> error:` and `... listening on` log lines. |
| `_fallbackError(port)` | Error text for a bind failure without a message. |
| `_onListening()` | Optional. Extra result fields; record per-run identity here. |
| `_onCleared()` | Optional. Drop per-run identity on stop or failure. |

Bind errors map to `Port N is already in use by another program.` (EADDRINUSE),
`Permission denied for port N. Try a port above 1024.` (EACCES), else the
error's message, else `_fallbackError(port)`.

## Why

Both listeners are owned by SharingHostService (via HostListeners) and must
degrade rather than fail: a failed bind is reported so enabling sharing falls
back to the plain surface and the settings UI can show the error.
