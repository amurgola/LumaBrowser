# MusicRuntimeServer

`core/music-server/server/MusicRuntimeServer.js`

Supervises one `sgl-omni serve` child. Extends
[BaseRuntimeServer](../../shared/runtime/BaseRuntimeServer.md) (runs
`BaseRuntimeServerContract`). On Windows the child is wsl.exe in front of the
real server inside WSL2; [WslHostFailover](WslHostFailover.md) handles what that
changes.

## Methods

- `MusicRuntimeServer.findFreePort(opts)` a free port in the `music` window
  (`MusicRuntimeServer.PORT_RANGE`, 8160-8179).
- `MusicRuntimeServer.SETTLE_TIMEOUT_MS` (1200000): the cold start reads a
  ~27 GB working set and initializes two model stacks; the planner scales
  `healthTimeoutMs` to 8-20 minutes and coalescing callers wait as long.
- `getStatus()` adds `mode` (`native` or `wsl`), `distro` (WSL only) and `host`
  (`plan.host`, which the request adapter reads).

## Hooks

- `_initLaunchState(launch)` builds the failover from `plan.mode`, `plan.distro`
  and `plan.host`; a host change writes `plan.host`.
- `_healthCheck()` `GET /health` answers 200 (2 s per request), on the planned
  host or the distro IP fallback.
- `_beforeForceKill()` kills by port inside the distro (killing wsl.exe leaves
  the Linux process and its VRAM alive); `_afterStopped()` fires once more,
  detached, because a wedged CUDA kernel can survive the first `fuser -k`.
- `_logTag` `[music-server]`, `_processNoun` `sgl-omni`, `_loadingLabel` `music server`.
