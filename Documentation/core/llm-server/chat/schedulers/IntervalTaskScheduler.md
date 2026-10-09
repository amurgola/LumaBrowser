# IntervalTaskScheduler

`core/llm-server/chat/schedulers/IntervalTaskScheduler.js`

Base class for the schedulers that run [IntervalTaskStore](../IntervalTaskStore.md)
tasks as background agent runs.

## Rules

- ONE master tick (`TICK_MS`, 30 s) scans for due tasks; no per-task timer
  (those drift and die on laptop sleep). After a wake the next tick sees every
  past-due task and runs each once (no backfill); the store reschedules from
  completion time. `start()` also ticks once `CATCH_UP_DELAY_MS` after boot.
- One run in flight, behind the shared [BackgroundRunGate](../BackgroundRunGate.md);
  a tick that finds a user chat streaming (`router.active`) backs off for
  `DEFER_MS` (2 min). Remaining due tasks run on later ticks.
- Runs go through a PRIVATE [AgentChatBridge](../AgentChatBridge.md) (the
  router's is serial-only and owned by the interactive chat), with a hard
  `RUN_TIMEOUT_MS` (5 min) via [CapturedBridgeRun](CapturedBridgeRun.md).
- Every run is a hidden [RunTranscript](RunTranscript.md) plus a run row that
  keeps the outcome forever; transcripts beyond the keep setting are pruned.
- Every outcome (ok, error, runtime not ready) records completion, so a broken
  task never runs in a tight loop.

## Methods

- `new Subclass({ taskStore, settingsDb?, getAgentDeps, getRouter, emitEvent?,
  gate?, bridgeFactory?, now? })`. Throws `<Class> must declare <NAME>` for a
  missing declaration and `<Class> requires a taskStore`. `bridgeFactory(router)`
  defaults to `new AgentChatBridge({ router })`; `now()` is the clock for the
  back-off (tests).
- `start()` (idempotent), `stop()`.
- `tick()`: resolves the finished run row, or null when nothing ran.
- `runNow(taskId)`: `{ success, run }` or `{ success: false, error }` with
  `task not found`, `DISABLED_ERROR`, `another scheduled run is in progress`,
  `a chat is streaming; try again shortly`, `run failed to start`.
- Events: `run-started` `{ taskId, runId, ...extras, title }` and
  `run-finished` `{ taskId, runId, status, ...extras, title }`.

## Subclass contract

Declarations: `GATE_OWNER`, `KEEP_TRANSCRIPTS_KEY`, `MESSAGE_ID_PREFIX`,
`CATCH_UP_DELAY_MS`, `DISABLED_ERROR`, `OUTCOME_FIELD`. Hooks:
`_runConfig(task, deps)` -> `{ modelRef, allowedTools }` (required),
`_buildRunPreamble(task, kind)` (required), `_runExtras(kind)` and
`_eventExtras(task, kind)` (optional, `{}`).

Implementations: [ArtifactTaskScheduler](../ArtifactTaskScheduler.md), [ScheduledTaskScheduler](../ScheduledTaskScheduler.md).
