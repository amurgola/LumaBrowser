# DebuggerTraceRecorder

`core/diagnostics/DebuggerTraceRecorder.js`

Records a Chromium trace through a webContents debugger (the DevTools
protocol's `Tracing` domain, protocol `1.3`) and returns it as JSON trace
events. [RuntimeTraceCapture](RuntimeTraceCapture.md) uses it on the shell's
webContents. The trace covers that page's renderer, the browser process and the
GPU process.

## Methods

- `new DebuggerTraceRecorder(webContents)`.
- `start(categories)` attaches the debugger (throws while DevTools holds it),
  listens for `Tracing.dataCollected` and `Tracing.tracingComplete`, and sends
  `Tracing.start` with `transferMode: 'ReportEvents'` and the given
  `includedCategories`. A failed start releases the debugger and rethrows. The
  debugger stays attached until `stop()`, so a
  [RendererCpuProfiler](RendererCpuProfiler.md) started meanwhile can share it
  (`shareDebugger`).
- `stop()` sends `Tracing.end`, waits for `Tracing.tracingComplete` (Chromium has
  flushed every process; rejects after `END_TIMEOUT_MS`, 30000), and resolves
  `{ traceEvents }`. The listener is removed and the debugger detached in every
  case; a detach failure never loses a trace already taken.

## Why

Since Electron 45 `contentTracing.stopRecording` writes Perfetto protobuf only,
which [RuntimeTraceSummary](RuntimeTraceSummary.md) cannot parse. The DevTools
protocol still returns JSON events; the cost is that renderers of other tabs are
not in the trace.
