# TabSession

`core/browser/ui/TabSession.js` (ES module)

The renderer-side record of one browser tab: url, title, loading state and a capped history of visited urls, serialisable for API replies and AI context.

## Methods

- `new TabSession({ id, webview, tabElement, url = 'about:blank', title = 'New Tab', silent = false })`;
  a real initial url is the first history entry.
- `onNavigate(url)`, `onTitleUpdate(title)` (renames the latest history entry),
  `onLoadStart()`, `onLoadFinish()`.
- `getHistory()` copies `[{ url, title, visitedAt }]`; consecutive duplicates are
  skipped and the oldest entry drops past `TabSession.HISTORY_CAP` (50).
- `toJSON()` `{ id, url, title, loading, createdAt, lastNavigatedAt,
  historyLength, silent, active: false }` (the caller sets `active`);
  `toDetailedJSON()` adds `history`.

## Globals

None.
