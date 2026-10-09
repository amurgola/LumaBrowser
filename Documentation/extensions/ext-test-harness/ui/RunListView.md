# RunListView

`extensions/ext-test-harness/ui/RunListView.js`

Markup for the Test Harness "Run History" list.

## Methods

- `RunListView.render(runs, expanded)`: one `.th-run-item[data-run-id]` per
  run: status badge (`th-run-status <status>`), test id, variant, start time,
  duration, then the summary and ` | N pass, M fail` when the run has
  assertions. `expanded` (`{ runId, detail }` or null) appends
  [RunDetailView](RunDetailView.md) under that run. Empty: `No test runs yet`.
