# TestTabs

`extensions/ext-test-harness/lib/TestTabs.js`

Best-effort reads of the browser's tab list for the harness agent.

## Methods

- `new TestTabs(browserService)`.
- `describeActive()`: `Tab <id>: <url> (<title or 'untitled'>)` for the first
  tab with an id, else `No active tab`.
- `hasValidTab()`: any tab with an id.
- `TestTabs.listFrom(result)`: accepts `{ tabs }`, `{ data }` or a bare array.

A throwing `getTabs` reads as no tabs.
