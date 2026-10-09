# SyncSourceRepository

`extensions/personal-hub/sync/SyncSourceRepository.js`

Base repository for the Hub's remote sources (calendar feeds, task trackers):
one row per source with its JSON config, sync interval and last-sync outcome.
Subclasses only name the table (`static TABLE`) and whether it has a `color`
column (`static HAS_COLOR`).

## Methods

- `list()`, `get(id)`, `due(nowIso)` (enabled sources whose `next_sync_at` is
  unset or not after `nowIso`).
- `insert({ id, kind, label, color?, config, enabled?, intervalMs })`: the
  first sync is due at once.
- `update(id, columns)`: an object `config` is serialised; `updated_at` is set.
- `recordSync(id, { status, error, lastSyncAt, nextSyncAt })`.
- `delete(id)`.
- `static hydrate(row)`: the camelCase source with `config` parsed.

Subclasses: [CalendarSourceRepository](../calendar/CalendarSourceRepository.md),
[TaskSourceRepository](../board/TaskSourceRepository.md).

## Why

Both source kinds share the exact sync bookkeeping; one base keeps the
scheduler's `due` query and the services' `recordSync` identical.
