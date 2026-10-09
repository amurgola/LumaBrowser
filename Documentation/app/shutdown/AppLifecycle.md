# AppLifecycle

`app/shutdown/AppLifecycle.js`

The app's lifecycle events.

## Methods

- `new AppLifecycle(ctx, { shutdown?, log? })`; `shutdown` defaults to a
  [ShutdownSequence](ShutdownSequence.md).
- `wire()`: SIGINT and SIGTERM (run the shutdown, then `exit(0)`), the
  [QuitController](../../core/shell/QuitController.md) (`ctx.quitController`, 5 s
  budget, `dialog.showMessageBox`, `ChildProcessRegistry.killAll`, prompting only
  with a live window and outside Docker), and the app events below.
- `quitCleanup()` the controller's cleanup: stop the pulse, flush the favicon
  cache and the resolution cache, run the shutdown, close settings.db, then
  destroy the activity log and close the knowledge base and the documentation
  index.
- `onBeforeQuit(event)`: always `preventDefault()` (the controller owns the
  exit); a second Quit while quitting is absorbed; removes the CLI handshake (a
  stale one would send the CLI to a dead port); `requestQuit()`, warning when the
  user kept the app open; a controller failure forces `app.exit(1)`.
- `onChildProcessGone(details)` logs a non-clean GPU or utility process exit.
- `onAllWindowsClosed()` stops the gateway and quits.
- `onActivate()` (dock or taskbar): reopens a closed window, or renews a
  suspended renderer.
