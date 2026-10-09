# TimedTaskService

`extensions/timed-tasks/TimedTaskService.js`

The timed-task operations the IPC handlers, REST routes and MCP tools share.

## Methods

- `new TimedTaskService({ repository, runner, broadcast, now? })`.
- `recoverAfterRestart()`: marks `running` runs as `Interrupted by app
  shutdown`, resets `running` tasks to `idle`, gives enabled tasks without a
  `next_run` one (existing stamps are kept), returns the enabled count.
- `getAllTasks()`, `getTask(id)`.
- `createTask(data)`: `task_...` id, first run one interval from now (none
  when created disabled), broadcasts `created`.
- `updateTask(id, updates)`: null for an unknown id; a changed
  `repeatInterval` or `enabled` re-arms from now (or nulls `next_run`);
  broadcasts `updated`.
- `setEnabled(id, enabled)`, `deleteTask(id)` (run result; broadcasts `deleted`).
- `getTaskRuns(taskId, limit = 20, offset = 0)`, `getRun(runId)`,
  `getRunLog(runId)` -> `{ run, task, log }` (log parsed) or null.
- `triggerNow(id, { silent = false })`: throws `Task not found`.
