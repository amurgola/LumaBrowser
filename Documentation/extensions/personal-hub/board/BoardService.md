# BoardService

`extensions/personal-hub/board/BoardService.js`

The Hub's task board: columns, local and imported tasks, their messages, the
remote sources they sync from, and the sync itself. The one principle: a write
against a remote task is pushed at once and, when the push fails, left pending
for the next sync, so the board never blocks on a tracker being down.

Local tasks move freely. A remote task lives in the column its tracker status
is linked to (see [StatusMapping](StatusMapping.md)), or in a pseudo column
`~<status>` until the user links that status (merge it into a column, or make
it a column). Moving a remote task pushes a status its list really has; when no
linked status fits, the move asks for one instead of guessing.

## Construction

```js
new BoardService({
  columns: BoardColumnRepository, tasks: TaskRepository, messages: TaskMessageRepository,
  sources: TaskSourceRepository,
  secrets,                      // { get, set, delete, has } over strings (TriggerSecrets)
  providers: { clickup: new ClickUpTaskProvider() },
  emit: (type, payload) => {},  // the Hub broadcast
  fetchImpl: null,              // passed through to providers (tests)
  now: () => new Date(),
})
```

Tokens live under the secret id `BoardService.tokenId(sourceId)` =
`hub:task:<sourceId>:token`, never in the source row.

## Columns

- `listColumns()`.
- `saveColumns([{ key, title, isDone }])`: replaces the set. Keys must be
  unique kebab-case, titles non-empty, at most one `isDone` (the last column
  when none is flagged); `sortOrder` is the array position. Local tasks in a
  dropped column move to the first column; every source's links and
  `statusMap` entries to dropped columns are pruned and its remote tasks are
  placed again by status (a pseudo column when nothing links it any more).
  Emits `board.changed { reason: 'columns' }`.
- `linkStatus(status, columnKey)` -> `{ columnKey, sources }`: links the status
  to a real column (StatusMapping `link`) on every source holding tasks in the
  status's pseudo column, or on every source when none does, and places their
  tasks again. Throws for a blank status or unknown column. Emits
  `board.changed { reason: 'status-linked', status, columnKey }`.
- `addStatusColumn(status)` -> the new column: makes a pseudo column real, a
  column titled after the status with a unique kebab key (`-2`, `-3` when
  taken), inserted before the done column, then linked with `linkStatus`.
- `resetStatusLinks(sourceId)` -> the public source: clears the source's
  `statusColumns`, `statusLabels` and `statusMap`; its tasks go back to name
  matching or pseudo columns. Emits `board.changed { reason: 'status-linked',
  sourceId }`.

## Tasks

- `listTasks({ columnKey?, sourceId?, includeArchived?, includeHidden? })`:
  tasks with `sourceLabel` and `sourceKind` (`''` for local ones); hidden
  tasks are left out unless `includeHidden`.
- `getTask(id)` -> `{ task, messages, source }` or `null`.
- `async createTask({ title, description?, columnKey?, priority?, dueAt?,
  tags?, sourceId?, listId?, status? })`: without `sourceId` a local task
  (first column by default). With one, the task is created in the tracker
  first, in `listId` (default the source's first list; it must be one the
  source imports), assigned to the source's `assigneeId` (resolved now if
  needed), with its status chosen the same way as a move (below). When no
  status of that list fits the column the reply is `{ needsStatus: true,
  statuses, column }` and nothing is created; call again with `status`, which
  links it to the column. The task is then stored under its remote id so the
  next sync matches it instead of importing it again; a pull that already
  inserted it is updated, not duplicated. Throws without a title, with an
  unknown column, for an unknown or disconnected source, for a picked status
  the list does not have, or on a remote failure (nothing is stored).
- `async updateTask(id, { title?, description?, priority?, dueAt?, tags? })` ->
  `{ task, pushError? }`: a remote task's title/description are also pushed;
  a failed push is reported, never thrown.
- `async moveTask(id, columnKey, { sortOrder?, status? })` -> `{ task, moved,
  pushed, pushError? }`: appends to the column when no order is given. Moving
  into a pseudo key throws. A local task just moves. For a remote task the
  status comes from StatusMapping `statusForColumn` with the statuses of the
  task's list (from [TrackerLists](TrackerLists.md)); when none fits the reply
  is `{ task, moved: false, pushed: false, needsStatus: true, statuses:
  [{ status, type, color, columnKey, columnTitle }], column: { key, title } }`
  and nothing changes (`columnKey`/`columnTitle` say where each status shows
  today, `null` when unlinked). A picked `status` must exist in the list (else
  it throws) and is linked to the column, so other tasks with that status
  reflow there. The status is stored as `pending_status` and pushed now;
  success clears it and sets `remote_status`, failure leaves it pending.
- `setTasksHidden(ids, hidden = true)` -> number changed: hides tasks from the
  board (done and out of the way) or shows them again. Throws for an unknown
  id. Emits `task.changed { taskIds, reason: 'hidden' | 'unhidden' }` when
  anything changed.
- `async listTaskTargets()` -> `[{ sourceId, label, kind, lists: [{ id, name }],
  error? }]`: where a new task can go, one entry per enabled, connected source.
  List names come from TrackerLists (`LIST_CACHE_MS` = `TrackerLists.CACHE_MS`,
  10 min); they fall back to the name seen on synced tasks,
  then `List <id>`. A failed lookup sets `error` and keeps the fallbacks.
- `archiveTask(id)`.

Every other change emits `task.changed { taskId, reason: 'created' |
'updated' | 'moved' | 'archived' | 'message' }`.

### Push errors

A failed status or field push is kept on the task (`sync_error`, hydrated as
`syncError`) and cleared by the next successful push. A new or changed error
emits `board.error { taskId, title, sourceLabel, message }` once; a message
that cannot be posted emits it too, with `message` prefixed `Message not
sent: `.

## Messages

- `listMessages(taskId)`.
- `async addMessage(taskId, body, { author = 'me' })` -> `{ message, synced,
  syncError? }`: a local message; on a remote task it is posted as a comment
  at once (marked synced with the remote id) or marked with the error for the
  sync to retry.

## Sources

- `listSources()`: sources with the token stripped from `config` and a
  `connected` flag (whether a token is stored).
- `addSource({ kind = 'clickup', label, config, intervalMs })`: validates
  through the provider, stores `config.token` as a secret, clamps the interval
  to 1 min..6 h (default 5 min), and marks the source due now.
- `updateSource(id, { label?, enabled?, intervalMs?, config? })`: config is
  merged (a `token` in it is re-stored) and re-validated; a config change
  places the source's remote tasks again (tasks with a pending move stay).
- `removeSource(id)`: deletes the source's tasks and secret.
- `async discover({ sourceId?, token?, kind? })`: the provider's tree with the
  stored or given token.

Source changes emit `board.changed { reason: 'source' }`.

## Sync

`async syncSource(source)` -> `{ sourceId, status: 'ok' | 'error', count,
pushErrors?, error? }`, never throws:

1. Resolve the token (a missing one is an error) and, once, the assignee id
   (persisted into `config.assigneeId`).
2. Fetch the tasks; comments are requested only for new tasks and tasks whose
   `remoteUpdatedAt` moved on.
3. Upsert: new tasks land in the column their status is linked or named for,
   else its pseudo column; existing ones get
   their fields refreshed (including `remoteStatusColor` and `listId`). A task
   with a `pending_status` keeps its local column until the remote status
   equals the pending one, which clears it. A hidden task the tracker moves to
   a different column is unhidden. Comments not yet stored (by remote id) are
   inserted as `remote` messages.
4. Tasks the sync did not see are archived (never deleted: local messages
   survive), except rows created after the pull started (a task created on the
   board while the fetch was in flight).
5. Pending statuses and unsynced local messages are pushed again;
   `pushErrors` counts the ones that failed. A pending status the task's list
   does not have (left by an older move) can never land: it is cleared, the
   task goes back to its mapped column and the error is kept on it.
6. The outcome is recorded on the source with `nextSyncAt = now + intervalMs`,
   on error too, and `task.changed { sourceId, reason: 'sync' }` is emitted.
   With push errors the status stays `ok` but `lastError` reads `N changes
   could not reach the tracker; see the board.`
