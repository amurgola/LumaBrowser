# DeferredServices

`app/ready/DeferredServices.js`

The deferred startup phase, run once per process.

## Methods

- `new DeferredServices(ctx, { log? })`.
- `start()` memoised; the setup wizard's finish (SettingsIpcHandlers
  `onSetupFinalized`), ShellIpcHandlers' `waitForExtensions` and the ready phase
  all call it. Steps: `chromeExtensionService.loadAllEnabled(defaultSession)` then
  `ready = true`; `adblockerService.init()`, `ready = true`,
  `applyToSession(defaultSession)`; await `ctx.identityReady` (a failure is
  ignored); [HeavyServices](HeavyServices.md)`.run()` when the window has
  exposed it. Each step's failure is logged and the next runs.

## Why

The adblocker compile, Chrome extensions, gateway listen and extension
activations are expensive and only needed after the user commits in the setup
wizard. Running the heavy phase twice activated every extension twice and hit
EADDRINUSE on the gateway port, hence the memo.
