# BaseRuntimeServer

`core/shared/runtime/BaseRuntimeServer.js`

Base class (an `EventEmitter`) for the supervisors of one native inference
child: llama-server (LLM, router, grounding), sd-server (image, video),
whisper-server, sgl-omni (music) and the Chatterbox add-on's audio.cpp server.

## Contract

Required hooks (the base throws `<Class> must implement <hook>()`):

- `_logTag()` log prefix, e.g. `'[llm-server]'`
- `_processNoun()` process name in error text, e.g. `'llama-server'`
- `_loadingLabel()` noun in the cancel message, e.g. `'image server'`
- `async _healthCheck()` true once the child accepts requests (a throw counts as "not yet")

Optional hooks (no-ops by default):

- `_initLaunchState(launch)` set launch-time fields (authKey, privatePort)
- `async _afterHealthy()` bring-up after health, before `ready` (the image
  AuthProxy); on failure it cleans up and rethrows
- `async _beforeForceKill()` runs in `stop()` before the kill (WSL `fuser -k`)
- `_afterStopped()` runs in `stop()` after the child is reaped
- `_extraStatus()` fields merged into `getStatus()`
- `_settleTimeoutMs()` settle window for `waitUntilSettled` (default 180000;
  video 600000, music 1200000)

Protected helpers subclasses call: `_setState(next, payload)`, `_forceKill()`,
`_disarmIdleTimer()`.

## Methods and fields

- `start(launch, { shouldCancel })` with `launch = { binaryPath, args, plan: { port },
  cudaDevice?, healthTimeoutMs? }`. Throws `Cannot start: server is <state>.`
  unless idle or error. Spawns from the binary's dir with
  [RuntimeSpawnEnv](server/RuntimeSpawnEnv.md), tracks the child in
  ChildProcessRegistry, polls `_healthCheck` every 200 ms up to
  `healthTimeoutMs` (default 5 min), then `_afterHealthy`, `ready`, arms the
  idle timer and returns `getStatus()`. A failed wait appends the stderr tail
  (`--- <noun> output (tail) ---`), kills the child and rejects.
- `stop()` disarms the idle timer, goes `stopping`, runs `_beforeForceKill`,
  waits for the child to really exit ([ChildReaper](server/ChildReaper.md)),
  runs `_afterStopped`, goes `idle`, returns `getStatus()`. No-op when idle.
- `getStatus()` returns `{ state, port, pid, plan, startedAt, lastError, logs, ...extra }`.
- `setIdleTimeout(ms)`, `markActive()` idle unload window and activity.
- `holdIdle()` reference-counted hold on the idle unload; returns an
  idempotent release. `idleHeld` is true while any hold is open.
- `waitUntilSettled(timeoutMs?)` resolves `'ready' | 'error' | 'idle' | 'timeout'`.
- `BaseRuntimeServer.sleep(ms)`, `HEALTH_POLL_INTERVAL_MS` (200),
  `HEALTH_TIMEOUT_MS` (300000), `SETTLE_TIMEOUT_MS` (180000).
- Public fields: `state`, `child`, `port`, `plan`, `startedAt`, `lastError`,
  `idleMs`, `healthTimeoutMs`, and the getter `logRing` (live entries, max 400).
- Events: `state-change` `{ state, payload }`, `log` `{ ts, stream, line }`.

## Why

Stop waits for the real exit because callers spawn a replacement immediately,
and the old process must have released its VRAM. A child `error` event can fire
while the process is alive (a stdio pipe error), so the base SIGKILLs it before
going to `error`; otherwise the next start stacks a second server on the card.
`holdIdle` exists because a chat turn waiting on a long image render must not
come back to an unloaded chat model. `waitUntilSettled` lets routers coalesce
onto a start in progress instead of stopping and relaunching it.

TtsServerService does not extend this class: it runs a utilityProcess worker
with no port and no health endpoint. It shares only [IdleTimer](server/IdleTimer.md).
