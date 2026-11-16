# DownloadManager

`core/browser/DownloadManager.js`

Observes every Chromium DownloadItem from the tab sessions and mirrors its state so
the chrome can show a downloads shelf and the downloads page
([DownloadsPage](downloads/DownloadsPage.md)) its list. Chromium still shows its own save dialog;
this class only watches. CSV/TSV never reach it: TabViewManager renders them inline.

Finished records (not in progress) are saved under `core.browser.downloads` in the settings db on every finish,
on `remove()` and on `clearFinished()`, and loaded back at construction flagged `restored: true` (ids continue after the
highest stored one), so the list survives a restart. A download still running at quit is not saved.

## Methods

- `new DownloadManager({ db })`; without a db the list is memory only.
- `track(item)` starts tracking an Electron `DownloadItem` and returns its info record.
- `list()` copies of all records, newest first; a `done` record whose file no longer exists has `missing: true`.
- `get(id)` a copy of one record, or null (`id` may be a numeric string).
- `cancel(id)` cancels an in-progress download.
- `open(id)` opens a finished download with the OS (`shell.openPath`).
- `showInFolder(id)` reveals a download that has a save path.
- `copyLink(id)` puts the address a download came from on the clipboard (async: Electron's clipboard answers
  with a promise).
- `remove(id)` takes one finished record off the list; the file stays on disk. A running download is refused
  (cancel it first).
- `clearFinished()` drops every record not in progress.
- Event `'changed'` (no payload) after `remove` and `clearFinished`: entries left the list, so a view reads it
  again. The chrome gets it as `tab-view:downloads-changed`, the downloads page as `{ type: 'changed' }`.
- Event `'download'` carries a copy of the record on every change:
  `{ id, filename, url, mimeType, state, received, total, savePath, paused, startedAt, finishedAt }`,
  `state` one of `progress | done | failed | cancelled`.
- `DownloadManager.HISTORY_LIMIT` (50).

Action methods return `{ success: true }` or `{ success: false, error }`.

## Why

- History is capped at 50 by dropping the oldest finished record; an in-flight
  download is never dropped, so the cap can be exceeded while many are running.
- The item is released (set to null) on `done` because Electron invalidates it then;
  this is also why a finished download cannot be cancelled.
- An `updated` event with state `interrupted` reads as `failed`; `done` maps
  `completed -> done`, `cancelled -> cancelled`, anything else to `failed`.
- `electron.shell` is required lazily so the class loads in plain Node for tests.
- Every DownloadItem getter is wrapped so a throwing or null getter falls back to a default.
