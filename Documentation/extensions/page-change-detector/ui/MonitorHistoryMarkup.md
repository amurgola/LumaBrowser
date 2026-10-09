# MonitorHistoryMarkup

`extensions/page-change-detector/ui/MonitorHistoryMarkup.js`

HTML for a monitor's check history, shared by the panel's inline history and
the settings page. Every value is escaped with `HtmlEscaper.escape`.

## Methods (static)

- `diffSummary(diff)`: the first line as `.pcd-diff-stats`, then one
  `.pcd-diff-line` per line (`pcd-diff-add` for `+ `, `pcd-diff-remove` for
  `- `); `''` for none.
- `changedEntry(h)`: a Changed row with time and `N chars`, plus the diff.
- `noChangeRun(run)`: `No change` or `No change (N checks)` with
  `oldest to newest` times.
- `collapseNoChangeRuns(items)`: folds consecutive unchanged checks into
  `{ isRun, count, firstTime, lastTime }`.
- `recentList(history)`: `N change(s) in the last M check(s)` then only the
  changed entries, or `No changes recorded yet.`
- `pageItems(items, changedOnly)`: a settings page; runs collapsed only in the
  all-checks view.
- `pager(page, totalPages)`: Newer / `Page X of Y` / Older, ends disabled.
- `monitorOptions(monitors)`: `<option>`s, or `No monitors yet`.

## Globals

None.
