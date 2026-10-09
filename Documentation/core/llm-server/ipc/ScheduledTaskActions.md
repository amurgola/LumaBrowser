# ScheduledTaskActions

`core/llm-server/ipc/ScheduledTaskActions.js`

The chat sidebar's Scheduled section and runs view.

## Methods

- `new ScheduledTaskActions({ deps, runConversations })`; `deps` is
  [LlmIpcDeps](LlmIpcDeps.md) (`scheduledTaskStore`, `scheduledTaskScheduler`,
  `emitSchedTasksEvent`), `runConversations` a [HiddenRunConversations](HiddenRunConversations.md).
- `list()` `{ tasks }` with run counts (empty without a store).
- `get(id)` `{ task }` (null without a store).
- `runs(taskId, opts)` `{ runs }` (empty without a store).
- `update(id, patch)` `{ task }` and `tasks-changed { taskId }`; throws
  `scheduled tasks unavailable` or `task not found`.
- `delete(id)` deletes the task and its run transcripts, emits; same refusals.
- `runNow(id)` the scheduler's result; `scheduled tasks unavailable` without one.
- `deleteTask(task)` purges its run transcripts, then deletes it.
- `deleteOwnedBy(conversationId)` deletes the tasks a setup conversation owns and
  emits `tasks-changed {}` once; best effort, never throws.
