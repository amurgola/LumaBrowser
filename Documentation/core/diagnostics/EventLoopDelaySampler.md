# EventLoopDelaySampler

`core/diagnostics/EventLoopDelaySampler.js`

Samples the main-process event-loop delay (`perf_hooks.monitorEventLoopDelay`,
5 ms resolution) into fixed buckets, so a stall can be placed in time and
matched against the traces of the same capture.

## Methods

- `new EventLoopDelaySampler({ bucketMs = 100, now = Date.now })`.
- `start()` enables the histogram and samples it every `bucketMs`, resetting it each time.
- `stop()` stops sampling and returns `[{ t, maxMs, meanMs }]`, `t` in ms since `start()`.
- `EventLoopDelaySampler.BUCKET_MS` 100.
