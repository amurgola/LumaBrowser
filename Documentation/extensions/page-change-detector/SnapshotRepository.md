# SnapshotRepository

`extensions/page-change-detector/SnapshotRepository.js`

Plain queries over `page_change_history`: one row per check, newest first.

## Methods

- `new SnapshotRepository(db)`.
- `latest(monitorId)`: `{ checksum, checked_at, text_preview }` or null.
- `insert(row)`: `id, monitor_id, checksum, changed, checked_at, text_length,
  text_preview, diff_summary`.
- `recent(monitorId, limit = 20)`.
- `paged(monitorId, { page, pageSize, changedOnly })`: `{ items, total, page,
  pageSize, changedOnly }`; page >= 0, pageSize 1..200 (default 25).
- `deleteForMonitor(monitorId)`.
