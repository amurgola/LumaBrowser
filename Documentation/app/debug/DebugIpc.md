# DebugIpc

`app/debug/DebugIpc.js`

The shell's two debug captures.

## Methods

- `new DebugIpc(ctx, { log?, createTracer? })`.
- `register(ipcMain)` handles `debug:runtime-trace` (Ctrl+Shift+U) and
  `debug:view-stack` (Ctrl+Shift+Y).
- `runtimeTrace(opts)`: one [RuntimeTracer](../../core/diagnostics/RuntimeTracer.md)
  capture of `clampDuration(opts.durationMs)` with `opts.label`; replies
  `{ success: true, ...result }`, `{ success: false, error: 'A runtime trace is already running' }`
  or the failure. The tracer is created on first use and published as
  `__lumaRuntimeTracer`.
- `viewStack()` a [ViewStackDump](ViewStackDump.md) capture.
- `DebugIpc.clampDuration(ms)`: 3 s to 120 s, default 15 s.
