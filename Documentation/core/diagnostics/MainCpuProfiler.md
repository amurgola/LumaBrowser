# MainCpuProfiler

`core/diagnostics/MainCpuProfiler.js`

[CpuProfiler](CpuProfiler.md) for the main process itself, through an
in-process `inspector.Session`.

## Methods

- `new MainCpuProfiler({ createSession? })` `createSession()` returns an
  inspector-like session (injectable).
- `start()`, `stop()`, `detach()` as CpuProfiler; `_send` wraps `session.post`
  in a promise.
