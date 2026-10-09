# CrashTracer

`core/diagnostics/CrashTracer.js`

An always-on, append-only journal of the main-process events that precede an
unexplained "the app just closed" exit, plus Crashpad minidumps for native
crashes that never reach JavaScript.

## Methods

Statics, operating on one shared per-process instance (what callers use):

- `CrashTracer.install()` installs the shared tracer; returns it. Call once, as
  early as possible in main.js: after userData is final (`LUMA_DATA_DIR`) and
  before the single-instance lock, so even the "second instance" exit is journaled.
- `CrashTracer.mark(label, extra?)` records a checkpoint. Safe before `install()`
  and in tests (no-op).
- `CrashTracer.getLogPath()`, `CrashTracer.getDir()`, `CrashTracer.getPreviousRunReview()`
  (null until installed).
- `CrashTracer.shared()` the shared instance, built from `electron.app` and
  `electron.crashReporter` when Electron is present.

Instance (for tests and for the parts):

- `new CrashTracer({ app, crashReporter, proc = process })`. Without an `app`
  (no Electron, or `ELECTRON_RUN_AS_NODE` where `require('electron')` is a path
  string) the tracer stays off and every call is a no-op.
- `install()`, `mark()`, `getLogPath()`, `getDir()`, `getPreviousRunReview()` as above.
- `write(line)`, `noteQuitRequested()`, `end(detail)` used by CrashTraceWiring.
  `end` writes `END <detail> clean=<quit requested> lastMark=<...>`, closes the
  file and stops the heartbeat; only the first call counts.

## What install does

1. Opens `<userData>/crash-trace/run-<iso-time>-<pid>.log` (CrashTraceJournal)
   and prunes to the newest 40 logs.
2. Writes a `START` line (pid, Electron/Chrome/Node versions, platform, argv).
3. Reviews the previous run (CrashTraceRunLogs); without an `END` line it is
   reported as abnormal on the console and in `last-abnormal.txt`.
4. Starts `crashReporter` locally (`uploadToServer: false`) with the run log
   name as an annotation. Each `mark` then updates the `last_mark` annotation,
   so a native crash dump names the last thing the app was doing.
5. Wires quit paths and lifecycle events (CrashTraceWiring).
6. Starts the heartbeat (CrashTraceHeartbeat).
7. Repro harness: with `LUMA_AUTO_QUIT_MS=<ms>` it marks `harness:auto-quit` and
   calls `app.quit()` that long after `ready` (scripts/crash-repro.js).

## Why

An intermittent exit about 10 s after launch, with nothing on stderr and no
dialog, left no evidence. A JavaScript quit always has a caller (app.quit,
app.exit, process.exit, window-all-closed), and a native crash in the browser
process always follows some native-view or webContents operation. The journal
records both sides; TabViewManager marks attach, detach, visibility, restore
and keep-alive operations. Every line is written synchronously so it is on
disk before whatever happens next.
