# RendererCpuProfiler

`core/diagnostics/RendererCpuProfiler.js`

[CpuProfiler](CpuProfiler.md) for a renderer's main thread, through
`webContents.debugger` at protocol `1.3`.

## Methods

- `new RendererCpuProfiler(webContents, { shareDebugger = false })`. With
  `shareDebugger` the debugger is one the caller already attached (the
  [DebuggerTraceRecorder](DebuggerTraceRecorder.md)'s during a runtime trace):
  the profiler neither attaches nor detaches it, it only sends its Profiler
  commands.
- `start()`, `stop()`, `detach()` as CpuProfiler.

## Why start can fail

DevTools holds the same debugger slot, so `start()` throws while DevTools is
open on that page. RuntimeTraceCapture records that as a note and skips the
renderer profile.
