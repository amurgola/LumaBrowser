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
  3. `_openSecretStores()`: awaits `open()` on the vault's
     [VaultStore](../../core/vault/VaultStore.md) and the
     [TriggerSecrets](../../core/llm-server/chat/triggers/TriggerSecrets.md), so
     they are decrypted into memory before any window, page or webhook asks for
     one. A store that fails to open is logged (`[secrets] the <name> could not be
     opened:`), reads as empty, and the app still starts. Boot log
     `secret stores opened`.
  4. `chromeExtensionService.init()`.
  5. The setup gate: `core.setupComplete`.
  6. `SessionSetup.hookSessions()`.
  7. [ContextMenu](../../core/shell/ContextMenu.md) (before the window, it
     attaches from `web-contents-created`) and [AppMenu](AppMenu.md).
  8. The main window ([MainWindow](../window/MainWindow.md)`.create()`).
  9. Setup complete: [DeferredServices](DeferredServices.md)`.start()`; else
     wait for the setup wizard's finish.
  10. [BackgroundStarts](BackgroundStarts.md).

The secret stores are opened here because the OS keychain
([OsKeychain](../../core/shared/OsKeychain.md)) is asynchronous and only works
once the app is ready.

## Extension menu and navigation

`_installMenus()` hands the ContextMenu an `extensionItems` provider backed by
`ShimBridge.contextMenus.templateFor`, and calls
`bridge.installNavigation(app, () => tabViewManager)` so tab navigations reach
extension workers as `chrome.webNavigation` events.
