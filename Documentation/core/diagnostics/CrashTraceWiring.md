# CrashTraceWiring

`core/diagnostics/CrashTraceWiring.js`

Hooks the main process for CrashTracer.

## Methods

- `new CrashTraceWiring(tracer, app, proc = process)`; `tracer` provides
  `write`, `noteQuitRequested` and `end`.
- `install()`:
  - wraps `app.quit`, `app.exit`, `app.relaunch` and `process.exit` so each call
    is journaled with the stack of its caller, then calls the original.
    `app.exit` also ends the run, because it is terminal and may skip node's
    `exit` hook. Quit paths mark the run as a requested (clean) quit.
  - journals app events (`will-finish-launching`, `ready`, `window-all-closed`,
    `before-quit`, `will-quit`, `quit`, `render-process-gone`,
    `child-process-gone`, `second-instance`), every new window's lifecycle
    events, and every new webContents' load, navigation, crash, responsiveness,
    preload-error and destroy events. `did-fail-load` with ERR_ABORTED (-3) is
    skipped: it only means a newer navigation replaced this one.
  - journals uncaught exceptions via `uncaughtExceptionMonitor` (observes
    without changing Electron's default error dialog), unhandled rejections
    (except the adblocker's "Script failed to execute" scriptlet noise),
    warnings, and ends the run on process `exit`.
