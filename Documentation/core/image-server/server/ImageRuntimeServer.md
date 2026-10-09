# ImageRuntimeServer

`core/image-server/server/ImageRuntimeServer.js`

Supervises one sd-server child and, once it is ready, fronts it with an
[AuthProxy](AuthProxy.md) so ApiSecurity applies. Extends
[BaseRuntimeServer](../../shared/runtime/BaseRuntimeServer.md) (runs
`BaseRuntimeServerContract`). Callers always connect to `port`, never `privatePort`.

## Methods and fields

- `new ImageRuntimeServer({ apiSecurity })`; without `apiSecurity` the proxy is
  skipped and the child binds the public port directly.
- `ImageRuntimeServer.findFreePort(opts)` a free port in the `image` window
  (`ImageRuntimeServer.PORT_RANGE`, 8100-8119); pass `exclude` to keep a
  launch's public and private ports apart.
- Public fields `privatePort`, `apiSecurity`, `authProxy`.
- `getStatus()` adds `privatePort` and `authProxy` (running or not).

## Hooks

- `_initLaunchState(launch)` `privatePort` = `plan.privatePort` when numeric,
  else `plan.port` (single-port mode).
- `_healthCheck()` any HTTP status on `GET <privatePort>/sdcpp/v1/jobs` (1.5 s):
  sd-server has no `/health`, and probing the private port reflects the child
  regardless of the proxy.
- `_afterHealthy()` starts the proxy (`publicPort: port`) when `apiSecurity` is
  set and the ports differ. A failed bind kills the child, goes to `error` with
  `Auth proxy failed to start: <reason>` and rejects the start.
- `_beforeForceKill()` stops the proxy first, so an in-flight request gets a
  clean 502 instead of outliving the child.
- `_logTag` `[image-server]`, `_processNoun` `sd-server`, `_loadingLabel`
  `image server`; settle window is the base 180 s.
