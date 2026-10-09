# AuthProxy

`core/image-server/server/AuthProxy.js`

Fronts a child sd-server with the shared ApiSecurity middleware. The child binds
a private loopback port the user never sees; this Express app binds the
user-visible port, runs `apiSecurity.middleware()` on every request, and
forwards the survivors to the child through http-proxy.

## Methods

- `new AuthProxy({ apiSecurity })`.
- `start({ publicPort, privatePort })` binds `127.0.0.1:<publicPort>`. Throws
  `AuthProxy: already running` or `AuthProxy: publicPort and privatePort are required`.
  A failed bind rejects and resets the proxy to stopped.
- `stop()` closes the server and proxy; idempotent.
- `isRunning()`.
- Public fields `server`, `proxy`, `publicPort`, `privatePort` (read by
  `ImageRuntimeServer.getStatus`).
- `AuthProxy.HOST` is `127.0.0.1`.

## Why

stable-diffusion.cpp's sd-server has no API-key flag, so it cannot enforce auth
the way llama-server does with `--api-key`. Using the same middleware as the
RestGateway keeps one source of truth: every server honours the same network
mode and keys, and a future "expose to LAN" bind will rely on ApiSecurity
requiring keys with no proxy-local fallback to forget. The middleware reads the
live config, so a key change after `start()` applies immediately.

sd-server has no `/health`; the supervisor probes the private port directly
before bringing the proxy up, so readiness reflects the child rather than
middleware 401s. Proxy errors (most often the child dying between the health
check and a real request) become a JSON 502 instead of crashing the process.
