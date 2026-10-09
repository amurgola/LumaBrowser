# MonitorFields

`extensions/page-change-detector/MonitorFields.js`

Maps the camelCase fields callers send to `page_change_monitors` columns.

## Methods (static)

- `forCreate(data)`: the insert columns with defaults (interval 300000,
  webhook `''`, desktop notifications on, enabled, no-refresh off, jitter 0).
  Throws `Name and URL are required`, or `Invalid URL` when the URL (with
  `https://` prepended to a bare host) does not parse.
- `forUpdate(updates)`: `{ column: value }` for every present field of `name,
  url, checkIntervalMs, webhookUrl, desktopNotifications, enabled,
  noRefreshRequired, intervalJitterPercent, selectors`; booleans become 0/1.
  Throws `No fields to update`.
- `clampJitter(value)`: a number in 0..100 (non-numeric -> 0).
- `selectorsColumn(value)`: a non-empty array as JSON, else NULL.
