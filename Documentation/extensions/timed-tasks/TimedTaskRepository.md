# TimedTaskRepository

`extensions/timed-tasks/TimedTaskRepository.js`

Plain queries over `timed_tasks` and `timed_task_runs`.

## Methods

- Tasks: `get(id)`, `all()` (newest first), `enabled()`,
  `enabledWithoutNextRun()`, `countEnabled()`, `insert(row)`, `update(id,
  columns)` (column names from code only), `recordOutcome(id, { lastRun,
  lastStatus, lastError })`, `delete(id)` (runs first; returns the SQLite run
  result), `resetRunningTasks()`.
- Runs: `insertRun(row)`, `finishRun(runId, { response, status, completedAt,
  error, conversationLog })`, `markWebhookSent(runId)`, `setRunError(runId,
  error)`, `getRun(runId)`, `listRuns(taskId, limit, offset)` (newest first),
  `markInterruptedRuns(nowIso)` (`Interrupted by app shutdown`).
