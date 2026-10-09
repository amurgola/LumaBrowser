# TraceThreadAnalyzer

`core/diagnostics/TraceThreadAnalyzer.js`

Analyses one thread's DevTools complete (`ph: 'X'`) slices.

## Methods

- `TraceThreadAnalyzer.analyze(slices)` returns
  `{ taskCount, taskWallMs, longestTaskMs, longTaskCount, selfTime, longTasks }`:
  - tasks are `ThreadControllerImpl::RunTask` slices; `longTaskCount` counts those >= 16 ms
  - `selfTime` the top 15 `{ name, ms }` by self time, keyed by the aggregate
    TraceEventLabel (RunTask's own time is `RunTask (uncategorized)`)
  - `longTasks` the 20 longest tasks `{ atMs: null, ts, durationMs, breakdown }`,
    `breakdown` being the 6 longest nested slices `{ what, ms }`. `atMs` is filled in by the caller.

## Why

Nesting is recovered with a stack over ts-sorted slices, so self time never
double counts a child inside its parent. The heaviest tasks are always listed,
even when none crosses 16 ms: that is itself the finding, and the list shows
what the ceiling looked like.
