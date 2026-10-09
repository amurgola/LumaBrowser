# MonitorListView

`extensions/page-change-detector/ui/MonitorListView.js`

The Page Monitors panel's head summary and monitor rows.

## Methods

- `new MonitorListView(root, invoke, actions)`: `actions` is
  `{ onCheck(id, btn), onMore(btn, monitor), onOpenUrl(url) }`.
- `render(monitors)`: summary plus rows (status dot, Paused / live / `N el`
  badges, change count, Check and more buttons, URL link, meta line, last
  error, history detail). Names, URLs and errors are escaped.
- `updateSummary()`; `tick()` refreshes the summary and meta lines only.
- `toggleHistory(id)`: one row expanded at a time; clicking a row (not its
  buttons, link or detail) toggles it.
- `loadInlineHistory(id)`: `getHistory(id, 10)` into the row detail; empty
  and error texts as legacy.
- `collapse(id)`, `expandedId`.

## Globals

None (opening a URL is the caller's action).
