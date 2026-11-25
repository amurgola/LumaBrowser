# LlmRuntimeServer

`core/llm-server/server/LlmRuntimeServer.js`

Supervises the chat model's llama-server child. Extends
[BaseRuntimeServer](../../shared/runtime/BaseRuntimeServer.md) (runs
`BaseRuntimeServerContract`) and adds the LLM-specific concerns.

## Methods and fields

- `LlmRuntimeServer.findFreePort(opts)` a free port in the `llm` window
  (`LlmRuntimeServer.PORT_RANGE`, 8080-8099; see [FreePort](../../shared/runtime/FreePort.md)).
- `baseUrl()` `http://<host>:<port>`; the host moves to the distro IP when a
  WSL-hosted runtime only answers there.
- `markDirty()` flags a `ready` or `starting` server untrustworthy (a cancelled
  turn can wedge llama-server's single slot); the next start path restarts it.
- `ensureStopped()` back to `idle` whatever the state: reaps any child (even one
  orphaned in `error`), clears `authKey` and `dirty`, emits `idle` (which
  releases the VRAM reservation) and, if a child was killed, waits
  `VRAM_RECLAIM_SETTLE_MS` (600) so the next launch reads reclaimed VRAM.
  Resolves `getStatus()`.
- `suspend()` the hotswap eviction for a runtime whose launch declares
  `suspend: { path }` (the Basalt add-on declares `/v1/sleep`; core names no
  runtime). On a `ready` server it POSTs `{}` to that path on the engine's own
  port (`baseUrl()`, the launch key as a bearer, `SUSPEND_TIMEOUT_MS` 8 s) and
  resolves `{ suspended: true, freed: true }` only for `200 { status: 'asleep' }`:
  the engine has released its VRAM by then and its next request wakes it. Every
  other answer (`200 not loaded`, `409 busy`, `409 no ram`, `409 unsupported`,
  any other status, no answer) resolves `{ suspended: false }`, and the
  [HotswapCoordinator](../../shared/runtime/HotswapCoordinator.md) stops the
  server as before. Logs `hotswap suspend: <code> <status>`. Without a declared
  path, or when not ready, resolves `{ suspended: false }` with no request.
- `LlmRuntimeServer.suspendPathOf(suspend)` the declared path when it is a plain
  absolute path (`/seg/seg`, unreserved characters only, no query, no empty or
  `..` segment), else null.
- Public fields: `dirty`, `authKey` (the launch-time key the chat adapter must
  use), `modelPath` (the served file), `suspendPath` (from the launch, null
  without one), `caps` (null until serving), and
  `recallProbe` (optional `(modelPath, templateHash) -> facts`, wired by the LLM
  service to [ModelCapsCache](ModelCapsCache.md)).
- `getStatus()` adds `dirty`, `lastErrorInfo`, `caps`, `modelPath`, `host`, `mode`.

## Hooks

- `_initLaunchState(launch)` snapshots a non-empty `launch.authKey`,
  `launch.modelPath` (the planner puts the file on the launch, not the plan) and
  the validated `launch.suspend` path (next to the base class's `killTree`), and
  builds a [WslHostFailover](../../music-server/server/WslHostFailover.md) from
  `plan.mode`, `plan.distro`, `plan.processPattern`. A host change writes
  `plan.host`.
- `_healthCheck()` `GET /health` answers 200 (1.5 s per request).
- `_afterHealthy()` sets `caps` from [LlmCapsProbe](LlmCapsProbe.md); never fails a start.
- `_beforeForceKill()` kills by port inside the WSL distro (no-op natively).
- `_afterStopped()` clears `authKey`, `dirty`, `caps`, `modelPath`, `suspendPath`, and fires one
  more detached WSL kill.
- `lastErrorInfo` is `FailureInterpreter.interpret(lastError + last 15 stderr
  lines)` while in `error`, else null: a post-ready crash's `lastError` carries
  no tail.

## Why

`ensureStopped` exists because `stop()` returns early when idle and assumes a
clean child; a child `error` event or a cancelled generation can leave a process
alive, and a fresh start would then stack a second resident model on top.

`suspend` keeps a pooled chat model alive through a hotswap: the image model
gets the card without the chat model paying a full reload when it comes back.
A suspended server stays `ready` and keeps its VRAM ledger claim, which is
flagged resident and so never debited (the live nvidia-smi reading shows the
released memory, which is exactly what the incoming pool member may use). It
takes the card back through `LLMServerService.reclaimCard` before any request.
