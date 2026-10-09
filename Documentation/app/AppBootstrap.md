# AppBootstrap

`app/AppBootstrap.js`

The composition root of the Electron main process. `main.js` (package.json
`main`) only does `new AppBootstrap({ rootDir: __dirname }).start()`.

## Methods

- `new AppBootstrap({ electron?, rootDir, env?, argv?, proc?, log?, processSetup? })`.
  `electron`, `env`, `argv`, `proc` and `log` are seams (defaults: the Electron
  module, `process.env`, `process.argv`, `process`, `console`); `processSetup`
  passes `{ crashTracer, debugLog }` stand-ins to [ProcessSetup](process/ProcessSetup.md).
- `start()` returns `false` when another instance holds the single-instance lock
  (this process is exiting and nothing is built), else `true`. Steps:
  1. `_createContext`: the [AppContext](AppContext.md) and its [BootClock](BootClock.md).
  2. `_prepareProcess`: [ProcessSetup](process/ProcessSetup.md).
  3. `_buildServices`: [AllRenderers](events/AllRenderers.md), [DesktopNotice](events/DesktopNotice.md),
     then [AppServices](services/AppServices.md) (every pre-ready service).
  4. `_buildWindowControllers`: [MainWindow](window/MainWindow.md) over
     [WindowServices](browser/WindowServices.md), [DeferredServices](ready/DeferredServices.md),
     [UpdateCheck](ready/UpdateCheck.md).
  5. `_registerIpc`: [CoreIpcRegistrar](ipc/CoreIpcRegistrar.md) with the update
     check and [DebugIpc](debug/DebugIpc.md); the routers land on `ctx.routers`.
  6. [AppLifecycle](shutdown/AppLifecycle.md)`.wire()`.
  7. `_scheduleReady`: `app.whenReady()` runs [ReadyPhase](ready/ReadyPhase.md),
     then (in its own callback, as legacy did) [SettledStarts](ready/SettledStarts.md).
- `ctx` (public) the AppContext, for tests.

## Startup order

Before ready: boot clock, `LUMA_DATA_DIR`, crash journal, instance lock, dev
console buffer, rejection tap, user agent, Chromium switches, settings.db and its
fix-ups, every service, every IPC controller, lifecycle events. On ready: install
identity and pulse (background), session policy, Chrome extension store, session
hooks, context menu, app menu, the window (tabs, automation, gateway pages, MCP,
extension discovery), the deferred phase for a returning user (Chrome extensions,
adblocker, gateway listen, extension activation, schedulers), then the timed
background starts, the local API, sharing (3 s) and placement (4 s).

## Entries

- `main.js`: builds and starts this class; nothing else.
- `mcp-server.js`: the stdio MCP entry external clients run as
  `node mcp-server.js` (Settings, "Export the MCP config", builds that command).
  It starts [McpServer](../core/shell/McpServer.md), stops it on SIGINT/SIGTERM
  and exit, and exits 1 when the server cannot start. It runs under a stock
  Node from `app.asar.unpacked`, so it loads Node built-ins only.
