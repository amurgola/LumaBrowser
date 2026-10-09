# ReadyPhase

`app/ready/ReadyPhase.js`

Everything that waits for Electron's ready event.

## Methods

- `new ReadyPhase(ctx, { updateCheck, log? })`.
- `run()`:
  1. `ctx.identityReady`: resolve the [MachineIdentity](../../core/install/MachineIdentity.md),
     then start the [PulseService](../../core/pulse/PulseService.md) (which
     self-gates on consent). In the background; a failure is logged
     `Machine identity failed:` and the pulse never starts.
  2. [SessionSetup](SessionSetup.md)`.applyPolicies()`.
  3. `chromeExtensionService.init()`.
  4. The setup gate: `core.setupComplete`.
  5. `SessionSetup.hookSessions()`.
  6. [ContextMenu](../../core/shell/ContextMenu.md) (before the window, it
     attaches from `web-contents-created`) and [AppMenu](AppMenu.md).
  7. The main window ([MainWindow](../window/MainWindow.md)`.create()`).
  8. Setup complete: [DeferredServices](DeferredServices.md)`.start()`; else
     wait for the setup wizard's finish.
  9. [BackgroundStarts](BackgroundStarts.md).
