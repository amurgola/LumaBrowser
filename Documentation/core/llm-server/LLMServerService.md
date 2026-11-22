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
  `vramWatchdogOptions` (merged into the watchdog options), `residentVram` (new
  [LlmResidentVram](service/LlmResidentVram.md)), `modelCaps` (new
  ModelCapsCache), `chatStore` (new ChatStore), `groupRouter` (new
  GroupRouterService), `ramPin` (the RamPinService below).
- Construction order: stores, then the supervisor (idle timeout from settings,
  `recallProbe` wired to ModelCapsCache, [LlmSupervisorHooks](service/LlmSupervisorHooks.md)),
  then GroupRouterService, [LlmDefaults](service/LlmDefaults.md), the RAM pin and
  ChatStore, then the one-time [LegacyChatMigration](LegacyChatMigration.md)
  (a failure is logged and never blocks boot). Nothing spawns a process.
- Public fields: `settingsDb`, `apiSecurity`, `queueManager`, `runtimeServer`,
  `modelCaps`, `vramWatchdog`, `residentVram` (the loaded chat model's own VRAM per
  card, wired by LlmSupervisorHooks), `groupRouter`, `ramPin` (RamPinService
  `luma-llm-ram-pin`, enabled by the `pinModelRam` default, target
  `LlmPinTarget#resolve(this)`), `chatStore`.
- Read-only pinned-tab getters: `tabViewManager`, `pinnedTabId`, `tabHtmlUrl`,
  `tabHtmlFileUrl`, `tabHtmlPath`, `tabPreloadPath`, `tabLoadedOk`.

On construction the service registers its models folder in
[ModelFolderRegistry](../shared/ModelFolderRegistry.md) (kind `'llm'`), so the
other model service's scanner never walks into it; the provider reads the
current `getModelsDirConfig().effectivePath`, so a changed setting is seen at
the next scan.

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
- `getVramPressure()` the watchdog state through [VramWarningSwitch](server/vram-watchdog/VramWarningSwitch.md)`.view`
  (no cards while the warning is off); `dismissVramPressure(card)`.
- `getVramWarning()`, `setVramWarning(value)` -> the boolean: the low-VRAM banner switch
  (`core.llm.vramWarning`, on by default); setting it resyncs the banner at once (rows
  clear when off, the real bands return when on).
- `getUnloadOnVramPressure()`, `setUnloadOnVramPressure(value)`.
- `getGpuHeadroomBytes()`, `setGpuHeadroomBytes(bytes)`: the per-card GPU headroom ([GpuHeadroom](../shared/runtime/GpuHeadroom.md)).
- The watchdog's `isIdle` is ready, nothing in flight and no idle hold
  (`runtimeServer.idleHeld`); its unload stops the server; its events go through the
  warning switch to the pinned tab as `core.llmServer.modelEvent` `{ type, payload }`
  (`vram-pressure` events only while the warning is on). Its per-card reserve is 0 on a
  unified-memory card, `CudaDevicePicker.SOFT_RESERVE_BYTES` (half the headroom) while the
  running plan has `softHeadroom`, else `PER_CARD_RESERVE_BYTES`, so a load the planner
  placed inside the soft headroom does not trip its own warning. While the warning is off
  the watchdog still samples and bands, so unload on VRAM pressure keeps working.

Queue, provider entry, API key:
- `setQueueManager(qm)`; `syncQueueConcurrency(slots)` calls
  `qm.ensureConcurrency('<id>::<selectedModel>', max(1, floor(slots)))`, a no-op
  without a queue or local model, swallowing queue errors.
- `computeLocalProviderEntry()` [LocalProviderEntry](service/LocalProviderEntry.md)
  with the supervisor's port, the display-name resolver and the installed models'
  `snapshot()`, so its `models` list every installed chat model.
- `getApiKeyForLaunch()` `{ required, key (first key), keyCount }`; no ApiSecurity is `{ false, null, 0 }`.

UI state ([LlmUiState](service/LlmUiState.md)): `getUiMode`, `setUiMode`,
`getSidebarCollapsed`, `setSidebarCollapsed`, `getLastModelRef`, `setLastModelRef`,
`setChatIntent`, `takeChatIntent`, `consumePendingSetupExpand`.

Settings ([LlmServerSettings](service/LlmServerSettings.md)): `isEnabled`,
`getOpenTabOnLoad`, `setOpenTabOnLoad(v)` -> `{ success: true, openTabOnLoad }`,
`getDefaultModelsDir()` `<base>/models`, `getRuntimesDir()` `<base>/runtimes`,
`getModelsDirConfig`, `setModelsDir`, `getAutoUnloadMs`, `setAutoUnloadMs(ms)`
(also applied to the live supervisor).

Frameworks: `frameworkSelection` ([FrameworkSelection](service/FrameworkSelection.md)), `frameworkOptions`
([FrameworkOptions](service/FrameworkOptions.md)), `runtimeChooser` ([RuntimeChooser](service/RuntimeChooser.md),
fed with the stored default runtime id and `FitRuntimePicker.hostOrder`) and `runtimeFollower`
([DefaultRuntimeFollower](service/DefaultRuntimeFollower.md)), built in `_createFrameworkStores`. Which runtime
serves a model is asked of `runtimeChooser`; `defaults.runtimeId` is the follower's record of that answer for the
default model. `getDefaults()` returns the stored defaults with the option values of the framework that serves
the default model laid over them (`frameworkOptions.overlay`); `setDefaults` hands its listeners that same view.
`frameworkOptions` is built with the runtime catalog (where builds declare their options), `globalDefaults` (the
raw `LlmDefaults.get()`) and a [SleepRamNote](service/SleepRamNote.md) over `runtimeServer.getStatus()`, both read
through closures since the store is built first.

Defaults and caps: `getDefaults()`, `setDefaults(patch)` ([LlmDefaults](service/LlmDefaults.md)). `setDefaults`
routes the framework fields of a patch (`FrameworkOptions.DEFAULT_FIELDS`: `kvCacheType`, `maxConcurrent`,
`tensorSplit`, `cacheReuse`, `cpuMoe`, `noMoeGpuCache`, `usePeerGpus`, `pinModelRam`, `openvinoDevice`) to
`frameworkOptions.set` for the framework that serves the default model after the save (that of `patch.runtimeId`
when the patch carries one, else of the stored runtime id); everything else goes to `LlmDefaults.set`. With no
framework known (no runtime id, or one the catalog does not list) the whole patch is written globally, as before.
`getLaunchDefaults(frameworkId?)` (the defaults plus the loaded model's own launch overrides, via
`modelSettings.launchDefaults`; what a launch reads): with a framework id, that framework's values lie over the
global defaults instead of the serving one's ([LaunchOverrides](server/launcher/LaunchOverrides.md) passes the
framework of the runtime preflight resolved);
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

`fitTestRunning`: a plain flag the [FitTestSession](ipc/FitTestSession.md) sets while a fit test runs (it stops
and restarts the chat server). Anything that needs a steady server reads it and holds off; the Model Testing
add-on refuses to start a run meanwhile.

Per-model stores: `getAllFitResults`, `getFitResults`, `saveFitResults`
([FitResultStore](service/FitResultStore.md));
`getModelDisplayNames`, `setModelDisplayName`, `resolveModelDisplayName`
([LlmModelDisplayNames](service/LlmModelDisplayNames.md)); `getModelDrafterChoices`,
`setModelDrafterChoice` ([LlmDrafterChoices](service/LlmDrafterChoices.md), applied to
every scan through `LlmModelsScanner.shared.useDrafterChoices`); `getModelLaunchFlags`,
`setModelLaunchFlags`, `resolveModelLaunchFlags` ([ModelLaunchFlags](service/ModelLaunchFlags.md));
`listInstalledChatModels()`, `freshInstalledChatModels()` (no rescan within a few seconds, what a model
picker waits on), `installedModelPath(stem)` ([InstalledChatModels](service/InstalledChatModels.md));
`selectInstalledModel(stem)` makes an installed model the default through
[LlmDefaultsUpdater](ipc/LlmDefaultsUpdater.md) (a running server stops), resolving false when it is not installed; the public
`modelSettings` field ([ModelSettings](service/ModelSettings.md) over
[ModelOverrideStore](service/ModelOverrideStore.md), [ModelProfileStore](service/ModelProfileStore.md)
and the launch flags store) holds the per-model overrides and model profiles.

Pinned tab ([PinnedLlmTab](service/PinnedLlmTab.md)):
- `attach(tabViewManager)`, `setWebBaseUrl(baseUrl)`, `ensurePinnedTab({ activate })`,
  `removePinnedTab()`, `notifyGatewayReady()`.
- `openChat()` sends `core.llmServer.showChat`; `openConversation(id)` then sends
  `core.llmServer.openConversation` with the id. Both false without a tab.
- `openSetup({ expand?, page? })` persists setup mode and the expand hint (cleared
  without one), turns the feature on if off, and sends `core.llmServer.showSetup`
  with `{ expand?, page? }` or null.
- `revealSetting(target)` (the search palette): a Tune target
  `{ surface: 'tune', field }` opens the chat and sends `core.llmServer.palette`
  `{ type: 'reveal', target: { tune } }`; a Setup target
  `{ surface: 'setup', page, subtab?, selector? }` opens Setup on that page and,
  with a selector, sends `{ type: 'reveal', target: { setup, selector, subtab? } }`.
  False when the tab cannot open. See [PaletteDeepLinks](ui/js/chat/PaletteDeepLinks.md).
- `openArtifact({ conversationId, artifactId })` opens the chat and sends
  `core.llmServer.palette` `{ type: 'artifact', conversationId, artifactId }`;
  false without both ids or a tab.
- `setEnabled(enabled)` -> `{ success: true, enabled }`; enabling creates the tab,
  disabling removes it.

- `releaseRuntime(runtimeId)` stops the chat server when its plan's `runtimeId`
  is that runtime and the server is not idle, then asks the group router to
  release it; resolves `{ server, router }`. `resumeRuntime(released)` calls
  `groupRouter.apply()` when the router was stopped. Used by
  [LlmRuntimeSetup](ipc/LlmRuntimeSetup.md) around an install, since the
  installer wipes the runtime's folder and a loaded DLL keeps it locked.

Lifecycle: construction starts the shared `NvidiaSmiStream` (the
`nvidiaSmiStream` option injects one) so placement and diagnostics read a live
VRAM snapshot before any model loads; `shutdown()` stops the server (warning on
failure), then the RAM pin, the router and the nvidia-smi loop, ignoring their
failures.

Statics: `DEFAULT_AUTO_UNLOAD_MS` (15 min), `RUNTIMES_CACHE_KEY`,
`MANUAL_BINARY_PREFIX`, `RAM_PIN_NAME`, `CHANNELS`.

## Why

The service is the single owner of the pinned tab's identity and of the one
chat-model supervisor, so every subsystem reaches both through it. The
`ServerLauncher` reads its defaults, caches, API key, launch flags, fit results
and RAM pin through this facade, which is why those stay public methods here.

## Changes (2026-11-09, helper model)

`helperModel` (a [HelperModelService](helper/HelperModelService.md)) is a fourth companion built in `_createCompanions` (seam `deps.helperModel`); `LlmDefaults` gets its settings; `releaseRuntime` also releases it and resolves `{ server, router, helper }`; `resumeRuntime` applies it back; `shutdown` stops it.

## Defaults listeners (2026-11-14)

`onDefaultsChanged(listener)` registers `listener(defaults)`, called after every `setDefaults(patch)`. Every writer of the defaults comes through `setDefaults` (the Setup card and the chat's model picker over IPC, the router switching models in LocalServerPrep, tools), so a listener hears of a change whoever made it. A throwing listener never fails the save. [LlmServerBroadcast](ipc/LlmServerBroadcast.md)`.relayDefaults` is the one listener today.
