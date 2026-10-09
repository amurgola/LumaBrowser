# TaskRepository

`extensions/personal-hub/board/TaskRepository.js`

Plain queries over `hub_tasks`: every task on the board, local ones
(`sourceId` null) and those imported from a remote source, with the column it
sits in, the remote status still waiting to be pushed (`pendingStatus`), the
last push error (`syncError`) and whether the user hid it from the board
(`hidden`).

## Methods

- `get(id)`, `findRemote(sourceId, remoteId)`.
- `list({ columnKey?, sourceId?, includeArchived?, includeHidden?, limit? })`:
  by column, sort order, creation; archived and hidden rows only on request.
- `insert(row)`: camelCase fields (`sourceId, remoteId, title, description,
  columnKey, remoteStatus, remoteStatusColor, priority, dueAt, url, listId,
  listName, spaceName, assignees, tags, sortOrder, remoteUpdatedAt,
  syncedAt`); a missing
  `sortOrder` appends to the column.
- `update(id, columns)`: snake_case column map from code; `assignees` and
  `tags` arrays are serialised here.
- `nextSortOrder(columnKey)`.
- `archiveMissing(sourceId, keepRemoteIds, { createdBefore? })`: archives the
  source's live tasks not in the list (a sync that no longer sees a task never
  deletes it); with `createdBefore`, rows created after it (added from the
  board while the pull was in flight) are left alone.
- `setHidden(ids, hidden)` -> rows changed: hides or shows tasks.
- `pendingStatusPush(sourceId)`: tasks whose move has not reached the tracker.
- `delete(id)` (with its messages), `deleteForSource(sourceId)`.

Rows hydrate to camelCase with `assignees`/`tags` parsed and `archived` as a
boolean, `hidden` likewise; `sync_error` becomes `syncError` (`null` when
clear).
