# ActivityLogStore

`core/activity-log/ActivityLogStore.js`

SQLite repository for activity log entries. It owns its own database file
(opened through [SqliteOpener](../database/SqliteOpener.md)) so the log can be
pruned or cleared without touching the settings database, and it closes that
handle itself. ActivityLogService is its only caller.

Entries come back as `{ id, tsStart, tsEnd, durationMs, caller, action, result,
summary, tabId, url, correlation, parentId, details }`. `details` is stored as
JSON; text that does not parse comes back as `{ _raw: text }` (see
[JsonColumn](../database/JsonColumn.md)).

## Methods

- `new ActivityLogStore(dbPath)` opens the file (or `':memory:'`) and creates
  the `activity_log` table and its indexes if missing.
- `insert(entry)` returns the new row id. Missing optional fields store as null.
- `update(id, patch)` patches `tsEnd`, `durationMs`, `result`, `summary`,
  `details`. A key left undefined keeps its stored value; null clears it.
  Returns false when the id does not exist.
- `getById(id)` the entry or null.
- `getChildren(parentId)`, `getByCorrelation(correlation)` oldest first.
- `query({ caller, result, since, until, correlation, search, topLevelOnly, limit = 200, offset = 0 })`
  newest first. Only top-level entries (no parent) unless `topLevelOnly` is
  false, so the list shows one row per logical operation. `search` is a
  substring match on summary, action and the details JSON. `limit` caps at 1000.
- `distinctCallers()` sorted caller names; `count()` all rows; `clear()`.
- `prune({ maxAgeMs, maxRows })` deletes entries older than `maxAgeMs`, then the
  oldest rows beyond `maxRows`. Zero or missing limits are skipped. Returns rows deleted.
- `close()` closes the database.

## Why its own file

The log can grow fast when enabled. Keeping it apart lets pruning and "clear
all" run without locking or bloating the settings database.
