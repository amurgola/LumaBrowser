# BrowserToolExecutor

`core/llm-service/tools/BrowserToolExecutor.js`

Runs one chat browser tool against BrowserService directly (no HTTP).

## Methods

- `BrowserToolExecutor.execute(toolName, params, browserService, defaults = {})`
  merges `defaults` under `params`, uses `tabId` (default 0), calls the mapped
  BrowserService method and resolves `{ success, data | error, ... }`. Never
  rejects: an unknown tool or a thrown error becomes `{ success: false, error }`.
- `BrowserToolExecutor.ACTIONS`: tool name -> `(browserService, tabId, params) => Promise`.

## Mapping notes

- `create_tab` opens in the background unless `activate: true`; `silent` is
  passed through (silent tabs cannot be activated or screenshotted).
- `get_tabs` copies `tabs` onto `data`; `create_tab`'s `tab` becomes `data`
  (via `toJSON()` when present). A non-object reply is wrapped as `data`.
- `observe_page` returns `{ success, message: digestText, count }`, since the
  digest is what the model reads.
- `screenshot` asks for CSS-pixel images (`cssScale` unless `fullPage`) so
  screenshot coordinates are `click_at` coordinates; `marks` only when asked.
- `click_at` sends `clickCount: 2` for `double: true` or `clickCount: 2`.
- `collect_list` accepts `baseSelector` as an alias for `itemSelector`.
- `get_source` defaults to `type: 'text'`; `wait_for` to a 5000 ms timeout.
