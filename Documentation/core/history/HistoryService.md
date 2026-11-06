# HistoryService

`core/history/HistoryService.js`

The browsing history API the IPC layer and UI use. It decides what counts as a
recordable visit and passes queries through to [HistoryStore](HistoryStore.md),
which it creates on the SettingsDatabase handle it is given.

## Methods

- `new HistoryService(settingsDb, { dedupeWindowMs = 30000 })`.
- `recordVisit(url, title)` the stored entry, or null when the url is not
  recordable or the same url was visited less than `dedupeWindowMs` ago
  (reloads and redirect chains would otherwise flood the list).
- `updateVisitTitle(visitId, title)` backfills a trimmed title once the page's
  `<title>` settles; empty titles or a missing id return false.
- `list(opts)`, `suggest(query, opts)` see HistoryStore.
- `deleteEntry(id)` boolean; `deleteUrl(url)` rows deleted.
- `clear({ before?, since? })` rows deleted.
- `HistoryService.isRecordable(url)` true only for `http://` and `https://`
  urls (trimmed, case-insensitive). Blank pages, `about:`, `chrome:`, `data:`,
  `file:` and the app's own pages are never recorded.

## Top sites

`topSites({ limit = 8, hiddenHosts, now })` the most visited sites of the last 90 days, one per host (`www.` folded), each the host's most visited page: `[{ url, title, host, visits }]`. Backs the new tab page.
