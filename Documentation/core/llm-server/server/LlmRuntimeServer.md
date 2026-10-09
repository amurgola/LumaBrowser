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
- Public fields: `dirty`, `authKey` (the launch-time key the chat adapter must
  use), `modelPath` (the served file), `caps` (null until serving), and
  `recallProbe` (optional `(modelPath, templateHash) -> facts`, wired by the LLM
  service to [ModelCapsCache](ModelCapsCache.md)).
- `getStatus()` adds `dirty`, `lastErrorInfo`, `caps`, `modelPath`, `host`, `mode`.

## Hooks

- `_initLaunchState(launch)` snapshots a non-empty `launch.authKey` and
  `launch.modelPath` (the planner puts the file on the launch, not the plan), and
  builds a [WslHostFailover](../../music-server/server/WslHostFailover.md) from
  `plan.mode`, `plan.distro`, `plan.processPattern`. A host change writes
  `plan.host`.
- `_healthCheck()` `GET /health` answers 200 (1.5 s per request).
- `_afterHealthy()` sets `caps` from [LlmCapsProbe](LlmCapsProbe.md); never fails a start.
- `_beforeForceKill()` kills by port inside the WSL distro (no-op natively).
- `_afterStopped()` clears `authKey`, `dirty`, `caps`, `modelPath`, and fires one
  more detached WSL kill.
- `lastErrorInfo` is `FailureInterpreter.interpret(lastError + last 15 stderr
  lines)` while in `error`, else null: a post-ready crash's `lastError` carries
  no tail.

## Why

`ensureStopped` exists because `stop()` returns early when idle and assumes a
clean child; a child `error` event or a cancelled generation can leave a process
alive, and a fresh start would then stack a second resident model on top.
