# BrowserToolExecutor

`core/llm-service/tools/BrowserToolExecutor.js`

Runs one chat browser tool against BrowserService directly (no HTTP).

## Methods

- `BrowserToolExecutor.execute(toolName, params, browserService, defaults = {}, run = {})`
  merges `defaults` under `params`, uses `tabId` (default 0), calls the mapped
  BrowserService method and resolves `{ success, data | error, ... }`. Never
  rejects: an unknown tool or a thrown error becomes `{ success: false, error }`.
  `run` is the agent run the call belongs to (`{ isAborted() }`).
- `BrowserToolExecutor.ACTIONS`: tool name -> `(browserService, tabId, params, run) => Promise`.

## Mapping notes

- `create_tab` opens in the background unless `activate: true`; `silent` is
  passed through (a silent tab can never be activated).
- `get_tabs` puts the tabs on `data` as [AgentTabs](../../browser/AgentTabs.md)
  selects them (`includeSilent`, `includeHidden`, no inline favicon image);
  `create_tab`'s `tab` becomes `data` (via `toJSON()` when present, shaped the
  same way). A non-object reply is wrapped as `data`.
- `observe_page` returns `{ success, message: digestText, count }`, since the
  digest is what the model reads; `selector` scopes it to one part of the page.
- `screenshot` asks for CSS-pixel images (`cssScale` unless `fullPage`) so
  screenshot coordinates are `click_at` coordinates; `marks` only when asked;
  `selector` captures one element instead.
- `click_at` sends `clickCount: 2` for `double: true` or `clickCount: 2`.
- `click_until` passes its target, stop conditions, interval, timeout and `alert` (only a literal `true`)
  to `clickUntil`, with `run.isAborted` as the loop's `shouldStop`: it is the one browser tool that runs
  long enough to need stopping.
- `collect_list` accepts `baseSelector` as an alias for `itemSelector`.
- `get_source` defaults to `type: 'text'` and passes `selector` on; `wait_for`
  defaults to a 5000 ms timeout.
