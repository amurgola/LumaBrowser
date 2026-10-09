# MainPerfRecorder

`tools/perf/MainPerfRecorder.js`

The main-process side of a profiling run. `start()` enables an event-loop delay monitor (10 ms resolution),
connects an inspector session and starts the CPU profiler, and marks `window-created` and `did-finish-load`
(with URL) milestones for every new window. Its `surface()` is published as `global.__lumaPerf` and read by
[PerformanceProfiler](PerformanceProfiler.md) through `app.evaluate`.

## Methods

- `new MainPerfRecorder({ app, webContents, session, loadTimer, outputDir, now, delay })`; `start()`,
  `mark(event, extra)`, `surface()` -> `{ stopCpuProfile, snapshot, resetDelay }`.
- `stopCpuProfile()` writes `<outputDir>/main.cpuprofile` and disconnects the session.
- `snapshot()` -> `{ milestones, modules, eventLoop: { maxMs, p99Ms, meanMs }, metrics, contents, versions }`.
