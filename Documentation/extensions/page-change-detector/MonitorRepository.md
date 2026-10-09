# MonitorRepository

`extensions/page-change-detector/MonitorRepository.js`

Plain queries over `page_change_monitors`. Rows are returned as stored, except
that the JSON `selectors` column is parsed to an array, or `null` when empty,
missing or invalid ("watch the whole page").

## Methods

- `new MonitorRepository(db)`.
- `all()` (newest first), `get(id)` (or null).
- `insert(row)`: `id, name, url, check_interval_ms, webhook_url,
  desktop_notifications, enabled, no_refresh_required, interval_jitter_percent`.
- `update(id, columns)`: `{ column: value }`; column names come from code only.
- `recordRead(id, { checkedAt, checksum })`: `last_run`, `last_checksum`,
  `last_status = 'ok'`, clears `last_error`.
- `changeCount(id)`, `incrementChangeCount(id)`, `delete(id)` (true when a row went).
