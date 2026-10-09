# TestListView

`extensions/ext-test-harness/ui/TestListView.js`

Markup for the Test Harness "Available Tests" list.

## Methods

- `TestListView.render(tests)`: one `.th-test-item` per test (grouped by
  suite in first-seen order) with a `.th-run-test-btn` per variant
  (`data-test-id`, `data-variant-id`, title `Run: <label>`), or one primary
  `Run` button with an empty `data-variant-id`. An empty list renders the
  `No tests found. Add .test.js files in extensions/<ext>/tests/` hint.
  Every value is escaped with HtmlEscaper.
