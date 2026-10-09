# MonitorText

`extensions/page-change-detector/ui/MonitorText.js`

The short wording page-monitor rows and summaries show.

## Methods (static)

- `dot(m)` -> `{ cls, title }`: `busy` Checking now, `''` Paused, `bad`
  Last check failed, `ok` Active (in that priority).
- `meta(m)`: `every 5 minutes ±25% · checked 2 min ago · next in 3 min`;
  `checking now` replaces the last-check part and hides next; `not checked
  yet` without a last run; next only for enabled monitors.
- `panelCount(monitors)`: `No monitors`, `N monitor(s)`, plus `, A active`
  when some are paused.
- `panelStatus(monitors)`: `N checking now`, else `N change(s) detected`
  plus `· F failing` (enabled monitors whose last check failed); `''` for none.
- `settingsSummary(monitors)`: `No monitors yet.` or `N monitor(s), A active.`
- `host(url)`: host plus path without a trailing slash; the raw value when it
  does not parse.
- `jitterChoice(monitor)`: the jitter select value: 0, 10, 25 or 50 as
  stored, any other positive value -> 25, else 0.

## Globals

None.
