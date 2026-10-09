# RuntimeTracer

`core/diagnostics/RuntimeTracer.js`

On-demand, bounded capture of everything that can stall the shell UI while the
app is being used (window drags, tab switches, panel toggles). Triggered from
the running app with Ctrl+Shift+U (`debug:runtime-trace` IPC in main.js),
not from a scripted launch. One capture is one
[RuntimeTraceCapture](RuntimeTraceCapture.md).

## Methods

- `new RuntimeTracer({ getWindow, outputRoot?, electron?, captureFactory? })`.
  `getWindow()` returns the shell BrowserWindow. `electron` and
  `captureFactory(opts)` are injectable for tests.
- `RuntimeTracer.defaultOutputRoot(app?)` `<userData>/perf-traces` when packaged,
  `<appPath>/test-data/performance` in dev.
- `isRunning()`.
- `start({ durationMs = 15000, label? })` creates `<outputRoot>/<label>/` and
  runs the capture. Resolves `{ dir, notes, headline, summary }` once the files
  are written and summarized. Rejects with `A runtime trace is already running`
  rather than overlapping, and with `Shell window is not available` when the
  window is missing or destroyed.
- `RuntimeTracer.safeLabel(label, now?)` replaces anything outside
  `[a-zA-Z0-9_-]` with `_`; the default label is `drag-<ISO time>` with `:` and
  `.` as `-`.

## Output files

`chromium-trace.json`, `main.cpuprofile`, `renderer.cpuprofile`, `report.json`,
then `summary.json` and `summary.md` from
[RuntimeTraceSummary](RuntimeTraceSummary.md). `scripts/summarize-runtime-trace.js`
re-runs the summary over an existing capture.
