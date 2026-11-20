# BackgroundTask

`core/llm-server/chat/tasks/BackgroundTask.js`

One tool call the chat model started in the background: what it runs, which reply
started it, where it stands, and once it has ended, what it returned and whether the
model has been given that yet. Held by [BackgroundTasks](BackgroundTasks.md).

## States

`QUEUED` (waiting in its lane, or for the reply in flight to end), `RUNNING`, and the
three `END_STATES`: `DONE`, `FAILED`, `CANCELED`. A task starts queued.

## Fields

- `id` (`bg-1`, `bg-2`, ...), `conversationId`, `tool`, `title`.
- `batchId`: the assistant message whose reply started the task (the task's own id when
  there is none). The tasks of one reply report back together.
- `createdAt`, `startedAt`, `endedAt`.
- `result`: the text the model is given ([BackgroundTaskResult](BackgroundTaskResult.md)).
- `artifacts`: the list the call's artifacts are pushed onto while it runs.
- `stopRequestedBy`: `'user'` or `'model'`, or null.
- `delivered`: the model has the result, from the automated message or from reading it
  with `background_task_status`.
- `artifactsShown`: the artifacts were shown in the thread already (by the status
  tool's reply), so they are not shown twice.

## Methods

- `ended`: in one of the end states.
- `begin(now)`: running.
- `end(state, result, now)`: an unknown state is stored as `FAILED`.
- `durationMs(now)`: from start to end, or to `now` while it runs; 0 for a task that
  never started.
- `view(now)`: the copy that leaves the registry: every field above plus `durationMs`,
  `stoppedBy` (who stopped it, only for a canceled task) and the artifacts narrowed to
  `{ id, title, type, language }`, what a message row keeps.
