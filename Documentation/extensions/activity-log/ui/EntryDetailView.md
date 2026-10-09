# EntryDetailView

`extensions/activity-log/ui/EntryDetailView.js`

The Activity Log viewer's detail pane for one span.

## Methods

- `new EntryDetailView(detailEl)`.
- `showLoading()`: `Loading...`.
- `showError()`: `Failed to load entry.` (`.luma-error`).
- `render(entry)`: result badge and action, `caller · start · duration`
  (`n/a` without one), then Summary, URL, Tab and Correlation sections when
  present, `Children (n)` with one `.al-detail-child` per child span (or
  `No child entries.`), and the details as indented JSON in a `<pre>`. Every
  value is escaped.
