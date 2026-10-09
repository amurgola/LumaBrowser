# TaskMessageRepository

`extensions/personal-hub/board/TaskMessageRepository.js`

Plain queries over `hub_task_messages`: the conversation on a task, both
comments pulled from the remote tracker (`direction = 'remote'`) and messages
written here (`direction = 'local'`) that are pushed back to it.

## Methods

- `get(id)`, `listForTask(taskId, { limit? })` oldest first,
  `findRemote(taskId, remoteId)`.
- `insert({ id, taskId, remoteId?, author, body, at, direction, synced })`.
- `markSynced(id, remoteId)`, `markSyncError(id, error)`.
- `unsyncedForSource(sourceId)`: local messages of the source's tasks that
  have not reached the tracker, oldest first (the sync's retry list).

Rows hydrate to `{ id, taskId, remoteId, author, body, at, direction, synced,
syncError }`.
