# CoreIpcRegistrar

`app/ipc/CoreIpcRegistrar.js`

Registers every core IPC controller once, at boot. Wiring only.

## Methods

- `new CoreIpcRegistrar(ctx, { ipcMain, updateCheck?, debugIpc? })`.
- `register()` returns the routers `{ chat, image, video, music }`. Order:
  1. the update check (`core.app.checkForUpdates`) when given;
  2. [TelemetryIpcHandlers](../../core/telemetry/TelemetryIpcHandlers.md) (an
     opt-out change starts or stops the pulse), [SettingsIpcHandlers](../../core/shell/SettingsIpcHandlers.md)
     (`onSetupFinalized` starts the deferred services), ChromeExtensionIpcHandlers,
     AdblockerIpcHandlers;
  3. `LlmServerIpcHandlers.register(llmServerService, deps)` with the same deps
     as legacy (db, getAgentDeps, the artifact, scheduled-task and trigger
     stores, runners and emitters, getHookBaseUrls, image, music, dashboard,
     liveApi) plus `docsKnowledgeBase` (the shipped documentation index); its
     router is `global.__lumaChatRouter`;
  4. DashboardIpcHandlers (with `getExtensionManager` for extension widgets), RagIpcHandlers, BrowserDataIpcHandlers;
  5. `ImageIpcHandlers.register`, `VideoIpcHandlers.register`,
     `MusicIpcHandlers.register` (routers published `__lumaImageRouter`,
     `__lumaVideoRouter`, `__lumaMusicRouter`), WhisperIpcHandlers,
     TtsIpcHandlers, GroundingIpcHandlers;
  6. SharingIpcHandlers (with [SharingPorts](../sharing/SharingPorts.md)),
     LocalApiIpcHandlers, PlacementIpcHandlers,
     `new LabIpcHandlers(() => global.__lumaRpLabService || null)`;
  7. [WindowControlIpc](WindowControlIpc.md);
  8. LlmIpcHandlers and ProviderConfigIpcHandlers;
  9. [ShellIpcHandlers](../../core/shell/ShellIpcHandlers.md) with
     `identity: machineIdentity` and `waitForExtensions` (starts the deferred
     services when setup is complete);
  10. [DebugIpc](../debug/DebugIpc.md) when given.
- `CoreIpcRegistrar.applyConsent(consent, pulseService)`.
