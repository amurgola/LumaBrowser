# TraceThreadCollector

`core/diagnostics/TraceThreadCollector.js`

Groups a Chromium trace's complete slices by thread and analyses the
UI-relevant ones.

## Methods

- `TraceThreadCollector.collect(trace, report)` threads sorted by task wall
  time, each `{ pid, tid, name, process, role, ...TraceThreadAnalyzer.analyze }`,
  with every long task's `atMs` set relative to the earliest slice. Returns `[]`
  without a trace. Only threads named like `CrBrowserMain`, `CrRendererMain`,
  `Compositor`, `CrGpuMain`, `VizCompositor`, `Chrome_IOThread` or
  `CrProcessMain` with at least one RunTask are kept.
- `role` is `shell UI thread` (CrRendererMain in the shell's pid from
  `report.shell.pid`), `main process` (CrBrowserMain), `page renderer`
  (CrRendererMain in a pid of any other `report.contents` entry), or `''`.
