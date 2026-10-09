# CpuProfiler

`core/diagnostics/CpuProfiler.js`

Base class for a V8 CPU profiler driven over the DevTools protocol. The
Profiler calls are shared; subclasses supply the channel.

## Methods

- `start()` attaches, then `Profiler.enable`, `Profiler.setSamplingInterval`
  (500 us), `Profiler.start`.
- `stop()` `Profiler.stop` and returns the profile object.
- `detach()` never throws.
- Subclasses implement `_attach()`, `_send(method, params)`, `_detach()`;
  the base versions throw `<Class> must implement _x()`.
- `CpuProfiler.SAMPLING_INTERVAL_US` 500.

## Implementations

- [MainCpuProfiler](MainCpuProfiler.md): the main process, via an inspector session.
- [RendererCpuProfiler](RendererCpuProfiler.md): a renderer, via its webContents debugger.
