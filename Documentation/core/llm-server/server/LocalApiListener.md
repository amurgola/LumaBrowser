# LocalApiListener

`core/llm-server/server/LocalApiListener.js`

The localhost API's HTTP listener: binds an app on 127.0.0.1 only and turns bind
failures into messages a person can act on.

## Methods and fields

- `new LocalApiListener({ logTag })`.
- `start(app, port)` closes any current server, then binds `127.0.0.1:port`.
  Resolves `{ success: true, port }` (the real port, so `0` works) or
  `{ success: false, error }`; never rejects. Logs the endpoint URL.
- `stop()` closes the server and drops open connections; resolves `{ success: true }`.
- `isRunning()`, `address()` (`server.address()` or null).
- Fields `port` (null when stopped) and `lastError` (cleared by a successful bind).
- `LocalApiListener.errorMessage(err, port)`:
  `EADDRINUSE` -> `Port <p> is already in use by another program. Pick another port for the local API.`;
  `EACCES` -> `Permission denied for port <p>. Try a port above 1024.`;
  else the error message, else `Could not start the local API on port <p>.`
- `LocalApiListener.BIND_HOST` `127.0.0.1`.
