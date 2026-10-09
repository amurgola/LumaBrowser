# LLMServerService

`core/llm-server/LLMServerService.js`

Owns the local LLM feature: its settings and launch defaults, the chat model's
supervisor and what follows it (VRAM watchdog, RAM pin, tool-group router), the
runtimes and diagnostics caches, and the pinned LLM tab. A facade over the
classes in [service/](service/); every legacy public method keeps its name.

## Construction

`new LLMServerService(settingsDb, { rootDir?, apiSecurity?, ...seams })`

- Throws `LLMServerService requires a SettingsDatabase` without `settingsDb`.
- `rootDir` holds `ui/llm-tab.html` and `llm-tab-preload.js` (default this folder).
  `apiSecurity` (ApiSecurity) is read at launch only.
- Test seams, each with its production default: `appBaseDir` (`AppPaths.appBaseDir`),
  `runtimeServer` (new LlmRuntimeServer), `launcher` (`ServerLauncher.shared`),
  `runtimeDetector` (`LlmRuntimeDetector.shared`), `runtimeCatalog`
  (`LlmRuntimeCatalog.shared`), `scanner` (`LlmModelsScanner.shared`),
  `gatherDiagnostics` (`SystemDiagnostics.gather`), `vramCoordinator`
  (`VramCoordinator.shared`), `releasePeers` (`RpcPeers.releaseAll`),
  `vramWatchdogOptions` (merged into the watchdog options), `modelCaps` (new
  ModelCapsCache), `chatStore` (new ChatStore), `groupRouter` (new
  GroupRouterService), `ramPin` (the RamPinService below).
- Construction order: stores, then the supervisor (idle timeout from settings,
  `recallProbe` wired to ModelCapsCache, [LlmSupervisorHooks](service/LlmSupervisorHooks.md)),
  then GroupRouterService, [LlmDefaults](service/LlmDefaults.md), the RAM pin and
  ChatStore, then the one-time [LegacyChatMigration](LegacyChatMigration.md)
  (a failure is logged and never blocks boot). Nothing spawns a process.
- Public fields: `settingsDb`, `apiSecurity`, `queueManager`, `runtimeServer`,
  `modelCaps`, `vramWatchdog`, `groupRouter`, `ramPin` (RamPinService
  `luma-llm-ram-pin`, enabled by the `pinModelRam` default, target
  `LlmPinTarget#resolve(this)`), `chatStore`.
- Read-only pinned-tab getters: `tabViewManager`, `pinnedTabId`, `tabHtmlUrl`,
  `tabHtmlFileUrl`, `tabHtmlPath`, `tabPreloadPath`, `tabLoadedOk`.

## Methods

Requests and starting ([LocalRequestTracker](service/LocalRequestTracker.md),
[LocalServerStarter](service/LocalServerStarter.md)):
- `beginLocalPrepare`, `endLocalPrepare`, `noteLocalRequestStart`,
  `noteLocalRequestEnd`, `onLocalInFlightChange(fn)` -> unsubscribe, `getLocalInFlight()`.
- `getLocalSlotCount()` the running plan's `maxConcurrent` through
  `EffectiveContext.clampSlots`, 1 when unknown.
- `getEffectiveContext()` `EffectiveContext.resolve({ status, defaults })`.
- `ensureRunning({ withVision })`, `whenVisionSettled()`.

VRAM pressure:
- `getVramPressure()` the watchdog state; `dismissVramPressure(card)`.
- `getUnloadOnVramPressure()`, `setUnloadOnVramPressure(value)`.
- The watchdog's `isIdle` is ready, nothing in flight and no idle hold
  (`runtimeServer.idleHeld`); its unload stops the server; its events go to the
  pinned tab as `core.llmServer.modelEvent` `{ type, payload }`.

Queue, provider entry, API key:
- `setQueueManager(qm)`; `syncQueueConcurrency(slots)` calls
  `qm.ensureConcurrency('<id>::<selectedModel>', max(1, floor(slots)))`, a no-op
  without a queue or local model, swallowing queue errors.
- `computeLocalProviderEntry()` [LocalProviderEntry](service/LocalProviderEntry.md)
  with the supervisor's port and the display-name resolver.
- `getApiKeyForLaunch()` `{ required, key (first key), keyCount }`; no ApiSecurity is `{ false, null, 0 }`.

UI state ([LlmUiState](service/LlmUiState.md)): `getUiMode`, `setUiMode`,
`getSidebarCollapsed`, `setSidebarCollapsed`, `getLastModelRef`, `setLastModelRef`,
`setChatIntent`, `takeChatIntent`, `consumePendingSetupExpand`.

Settings ([LlmServerSettings](service/LlmServerSettings.md)): `isEnabled`,
`getOpenTabOnLoad`, `setOpenTabOnLoad(v)` -> `{ success: true, openTabOnLoad }`,
`getDefaultModelsDir()` `<base>/models`, `getRuntimesDir()` `<base>/runtimes`,
`getModelsDirConfig`, `setModelsDir`, `getAutoUnloadMs`, `setAutoUnloadMs(ms)`
(also applied to the live supervisor).

Defaults and caps: `getDefaults()`, `setDefaults(patch)` ([LlmDefaults](service/LlmDefaults.md));
`getModelCaps(modelPath?)`, `getRunningThinking()` ([RunningModelCaps](service/RunningModelCaps.md)).

Diagnostics and runtimes ([LlmDiagnosticsCache](service/LlmDiagnosticsCache.md),
[NvidiaSmiPathSettings](service/NvidiaSmiPathSettings.md), ManagedRuntimeSettings
with cache key `core.llmServer.runtimesCache` and binaries under
`core.llmServer.runtimes.<id>.manualBinaryPath`): `getCachedDiagnostics`,
`setCachedDiagnostics`, `ensureDiagnostics({ force })`, `getSavedNvidiaSmiPath`,
`setSavedNvidiaSmiPath`, `isNvidiaSmiPathHintDismissed`,
`setNvidiaSmiPathHintDismissed`, `getCachedRuntimesView`, `setCachedRuntimesView`,
`invalidateRuntimesCache`, `ensureRuntimesView(opts)`, `getManualRuntimeBinary`,
`setManualRuntimeBinary`, `getAllManualRuntimeBinaries`. The runtimes view gets
its CUDA and GPU inputs from `ensureDiagnostics()`.

Per-model stores: `getAllFitResults`, `getFitResults`, `saveFitResults`
([FitResultStore](service/FitResultStore.md)); `getAllGambitResults`,
`getGambitResults`, `saveGambitResults` ([GambitResultStore](service/GambitResultStore.md));
`getModelDisplayNames`, `setModelDisplayName`, `resolveModelDisplayName`
([LlmModelDisplayNames](service/LlmModelDisplayNames.md)); `getModelLaunchFlags`,
`setModelLaunchFlags`, `resolveModelLaunchFlags` ([ModelLaunchFlags](service/ModelLaunchFlags.md));
`listInstalledChatModels()` ([InstalledChatModels](service/InstalledChatModels.md)).

Pinned tab ([PinnedLlmTab](service/PinnedLlmTab.md)):
- `attach(tabViewManager)`, `setWebBaseUrl(baseUrl)`, `ensurePinnedTab({ activate })`,
  `removePinnedTab()`, `notifyGatewayReady()`.
- `openChat()` sends `core.llmServer.showChat`; `openConversation(id)` then sends
  `core.llmServer.openConversation` with the id. Both false without a tab.
- `openSetup({ expand?, page? })` persists setup mode and the expand hint (cleared
  without one), turns the feature on if off, and sends `core.llmServer.showSetup`
  with `{ expand?, page? }` or null.
- `setEnabled(enabled)` -> `{ success: true, enabled }`; enabling creates the tab,
  disabling removes it.

Lifecycle: `shutdown()` stops the server (warning on failure), then the RAM pin
and the router, ignoring their failures.

Statics: `DEFAULT_AUTO_UNLOAD_MS` (15 min), `RUNTIMES_CACHE_KEY`,
`MANUAL_BINARY_PREFIX`, `RAM_PIN_NAME`, `CHANNELS`.

## Why

The service is the single owner of the pinned tab's identity and of the one
chat-model supervisor, so every subsystem reaches both through it. The
`ServerLauncher` reads its defaults, caches, API key, launch flags, fit results
and RAM pin through this facade, which is why those stay public methods here.
