# PerformanceSummary

`tools/perf/PerformanceSummary.js`

Turns a [PerformanceProfiler](PerformanceProfiler.md) run folder into `summary.json`: startup headline, idle
contents and process metrics, a per-thread map of outer task time (`ThreadControllerImpl::RunTask` events only, so
nested JS/layout/paint is not double counted; elapsed task time, not CPU use), the top 40 main-process functions by
sampled self time, and the rendering probe. Needs `report.json`, `chromium-trace.json` and `main.cpuprofile`.
Thin entry: `scripts/summarize-performance.js [dir]` (default `test-data/performance/run`), which prints the
highlights.

## Methods

- `new PerformanceSummary(dir).execute()` -> `{ summary, highlights }` and writes `summary.json`.
- `PerformanceSummary.highlights(summary)`: threads whose name contains `Main` or `adblock` or ends in
  `Compositor`, and the top 8 functions.
