# TimedTaskIpcHandlers

`extensions/timed-tasks/TimedTaskIpcHandlers.js`

IPC controller of Timed Tasks. Channels (all `ext.timed-tasks.*`):

| Channel | Reply |
|---|---|
| `getAllTasks()`, `getTask(id)` | rows (raw) |
| `createTask(data)` | `{ success: true, task }` or `{ success: false, error }` |
| `updateTask(id, updates)` | `{ success: true, task }`, `Task not found` or the error |
| `deleteTask(id)` | `{ success: changes > 0 }` |
| `getTaskRuns(taskId, limit = 20, offset = 0)`, `getRunById(runId)` | rows (raw) |
| `getRunLog(runId)` | `{ run, task, log }` or null (raw) |
| `triggerNow(id)` | `{ success: status !== 'error', ...outcome }` (visible tab) or `{ success: false, error }` |

## Methods

- `TimedTaskIpcHandlers.register(ipc, service)`.
