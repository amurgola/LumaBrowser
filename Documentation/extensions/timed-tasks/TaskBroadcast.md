# TaskBroadcast

`extensions/timed-tasks/TaskBroadcast.js`

Pushes `ext.timed-tasks.changed` `{ reason, taskId, task }` to every window.
Reasons: `created`, `updated`, `deleted`, `run-started`, `run-finished`.

## Methods

- `new TaskBroadcast({ ipc, repository, send? })`: channel
  `<ipc.namespace>.changed`; a null `ipc` disables it. `send` defaults to core
  [RendererBroadcast](../../core/shell/extensions/RendererBroadcast.md)`.send`.
- `emit(reason, taskId)`: `task` is the current row, or null.
