# RuntimeTraceCapture

`core/diagnostics/RuntimeTraceCapture.js`

One [RuntimeTracer](RuntimeTracer.md) capture. Starts every recording, waits
out the window while a countdown toast runs in the shell, stops them, writes
the files and summarizes them.

## Methods

- `new RuntimeTraceCapture({ electron, webContents, dir, durationMs, mainProfiler?, traceRecorder?, summarize? })`.
  `electron` supplies `app` and `webContents`; `webContents` is the shell's.
  `mainProfiler` defaults to a [MainCpuProfiler](MainCpuProfiler.md),
  `traceRecorder` to a [DebuggerTraceRecorder](DebuggerTraceRecorder.md) over
  the shell's webContents, `summarize` to `RuntimeTraceSummary.summarize`.
- `execute()` resolves `{ dir, notes, headline, summary }` (`summary` is the
  summary json, or null if summarizing failed).
- `RuntimeTraceCapture.TRACE_CATEGORIES` the Chromium trace categories.

## Sequence

1. `app.getAppMetrics()` as a baseline (CPU percent is measured since the previous call).
2. Chromium trace of the shell renderer, the browser process and the GPU
   process, through the trace recorder, first, because starting it syncs those
   processes and that setup should not land inside the profiles. Renderers of
   other tabs are not in it.
3. [EventLoopDelaySampler](EventLoopDelaySampler.md), main CPU profile,
   shell renderer CPU profile ([RendererCpuProfiler](RendererCpuProfiler.md),
   created here with `shareDebugger` when the trace is running, because the
   trace already holds the shell's debugger),
   renderer counters ([RuntimeTraceScripts](RuntimeTraceScripts.md)), countdown toast.
4. Wait `durationMs`.
5. Stop counters and both profiles before writing the large trace file, so the
   write is not attributed to the capture window. The recorder's
   `{ traceEvents }` is written as `chromium-trace.json`.
6. `report.json`: label, start time, duration, notes, event-loop series,
   renderer counters, shell webContents id and pid, every webContents, app
   metrics, `process.versions`.
7. Summary, then a final toast with the folder and headline for 12 s.

## Why not contentTracing

Since Electron 45 `contentTracing.stopRecording` writes Perfetto protobuf only,
which [RuntimeTraceSummary](RuntimeTraceSummary.md) cannot parse. The trace is
recorded over the shell's DevTools debugger instead (CDP `Tracing` domain),
which returns JSON trace events but only covers that page's renderer plus the
browser and GPU processes.

## Notes instead of failures

An unavailable Chromium trace, a renderer debugger already held by DevTools,
renderer counters that cannot install or stop, a profile that fails to stop,
and a failing summary each add a line to `notes`; the capture still completes
with whatever it has. Toasts never fail the capture. Only a main-profiler
failure rejects, as in legacy.

Fixed: when starting the main profiler threw, legacy left the event-loop
sampler interval running forever. The sampler and countdown are now stopped
before the error propagates (test: `a failing main profiler rejects and clears the running state`).
