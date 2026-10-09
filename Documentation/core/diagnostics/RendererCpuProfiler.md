# RendererCpuProfiler

`core/diagnostics/RendererCpuProfiler.js`

[CpuProfiler](CpuProfiler.md) for a renderer's main thread, through
`webContents.debugger` at protocol `1.3`.

## Methods

- `new RendererCpuProfiler(webContents)`.
- `start()`, `stop()`, `detach()` as CpuProfiler.

## Why start can fail

DevTools holds the same debugger slot, so `start()` throws while DevTools is
open on that page. RuntimeTraceCapture records that as a note and skips the
renderer profile.
