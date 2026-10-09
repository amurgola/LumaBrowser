# RuntimeTraceSummary

`core/diagnostics/RuntimeTraceSummary.js`

Turns a RuntimeTracer capture directory into `summary.json` and `summary.md`.
The question it answers is "what ran on the UI thread while it stammered?", so
threads are ranked by task time, and the shell renderer main thread and the
browser main thread are broken down into their longest tasks and what those
tasks spent their time on.

## Methods

- `RuntimeTraceSummary.summarize(dir)` reads the capture, writes both files and
  returns `{ json, markdown, headline }`.
- `new RuntimeTraceSummary(dir).execute()` the same, as an instance.

## Inputs

`report.json` is required (throws `Missing report.json in <dir>`).
`chromium-trace.json`, `main.cpuprofile` and `renderer.cpuprofile` are optional.

## Output (summary.json)

- `label`, `startedAt`, `durationMs`, `notes`
- `mainLoop`: worst event-loop delay, count of 100 ms buckets over 16 ms and
  over 50 ms, and up to 30 stalls (>= 50 ms)
- `renderer`: shell long tasks, rAF gaps, the 10 slowest input events, resize,
  mouse-move and native-view bounds counters
- `threads`: UI-relevant threads (TraceThreadCollector) without per-thread detail
- `shellUiThread`, `mainProcessThread`: `{ selfTime, longTasks }` or null
- `mainCpu`, `rendererCpu`: busy/idle (CpuProfileSummary.busy) or null
- `mainCpuFunctions`, `rendererCpuFunctions`: top self-time functions
- `processes`: `{ pid, type, name, cpuPercent, privateMB }`. Electron reports
  privateBytes in kilobytes; percentCPUUsage is since the previous
  getAppMetrics call, which RuntimeTracer makes at capture start.

No Electron imports, so it runs both in the app after a capture and from
`node scripts/summarize-runtime-trace.js <dir>`.
