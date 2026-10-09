# TimedTasksExtension

`extensions/timed-tasks/TimedTasksExtension.js`

Main-process side of Timed Tasks: recurring AI tasks run through the ai-chat
extension's agent, with an optional response schema and webhook.

## Methods

- `new TimedTasksExtension(overrides?)`: test overrides `{ webhook, broadcastSend }`.
- `activate(context)`: requires `context.extensions['ai-chat'].run` (throws
  `timed-tasks: the ai-chat extension did not expose run(), cannot activate`),
  [TimedTaskSchema](TimedTaskSchema.md)`.ensure(context.db)`, wires
  [TimedTaskRunner](TimedTaskRunner.md), [TimedTaskScheduler](TimedTaskScheduler.md)
  and [TimedTaskService](TimedTaskService.md), runs
  `recoverAfterRestart()`, starts the master tick (logs `scheduler armed for N
  active task(s)`), registers [TimedTaskIpcHandlers](TimedTaskIpcHandlers.md)
  and resolves the public API.
- `deactivate()`: stops the tick and forgets in-flight runs.
- `getApi()`: the public API, or null while inactive.

Public API (read by `routes.js` and `mcp-tools.js`): `getAllTasks`, `getTask`,
`setEnabled`, `updateTask`, `getTaskRuns(taskId, limit = 20, offset = 0)`,
`getRun(runId)` (new), `triggerNow(id, { silent = false })`, `createTask`
(async), `deleteTask` (returns the SQLite run result).

## Entry files

- `manifest.js`: id `timed-tasks`, tables `timed_tasks` and `timed_task_runs`,
  requires `ext:ai-chat`, right-panel `panel.html`, settings `settings.html`,
  routes at `/api/timed-tasks`, `mcpTools`.
- `main.js`: `{ activate, deactivate, getApi }` delegating to one instance.
- `mcp-tools.js`: `{ tools, handler }` through [TimedTaskTools](TimedTaskTools.md).
- `routes.js`: REST controller (list, create, get, patch, delete, enable,
  disable, trigger, runs, `runs/:runId`); shapes unchanged. `runs/:runId` now
  reads through `api.getRun` instead of querying `context.db` itself.
- `renderer.js`: module entry (loaded by the shell as `type="module"`) that sets
  `window.__ext_timed_tasks` over [ui/TimedTasksRenderer](ui/TimedTasksRenderer.md),
  which listens on `ext.timed-tasks.changed` ([TaskBroadcast](TaskBroadcast.md)).
- `panel.html`, `settings.html`: the panel and settings markup, copied unchanged.

## Why not the core interval-task bases

Core's IntervalTaskStore / IntervalTaskScheduler look similar but are a
different contract: their tables (`interval_ms`, `next_run_at`, `title`,
`prompt`, transcripts in ChatStore), a 5-minute minimum interval, runs on a
private AgentChatBridge gated by BackgroundRunGate. Timed Tasks keeps its own
user tables (`repeat_interval`, `request_prompt`, `response_prompt`,
`webhook_url`), a 1-minute minimum, ai-chat's `run()` with a visible tab for
manual runs, and a webhook. Reusing the bases would need a data migration and
change behaviour, so the extension keeps its own small scheduler.
