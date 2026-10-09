# PerformanceEntry

`tools/perf/PerformanceEntry.js`

What `scripts/performance-entry.js` does inside the profiled Electron process. Thin entry:
`scripts/performance-entry.js` (path-loaded by Electron, launched only by
[PerformanceProfiler](PerformanceProfiler.md), never imported by the app).

`execute()`: throws `Use scripts/profile-performance.js to supply an isolated profile` unless `LUMA_PERF_OUTPUT`
and `LUMA_DATA_DIR` are set; sets the app path to the repo root and `userData` to `LUMA_DATA_DIR`; seeds
settings ([ProfileSettingsSeeder](ProfileSettingsSeeder.md)); installs [ModuleLoadTimer](ModuleLoadTimer.md);
starts [MainPerfRecorder](MainPerfRecorder.md) and publishes its surface as `global.__lumaPerf`; requires
`main.js`; marks `main-required`. Returns the recorder.

## Methods

- `new PerformanceEntry(root, { electron, env, requireMain, loadTimer })`; `execute()`.
