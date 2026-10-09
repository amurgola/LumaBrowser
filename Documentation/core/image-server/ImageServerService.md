# ImageServerService

`core/image-server/ImageServerService.js`

Owns the Image Server core feature: its settings, the three sd-server slot
supervisors (generate, edit, video), the local and remote server selection, RAM
pinning of the default models and the launch of a model on a slot. A facade over
the classes in [service/](service/).

## Construction

`new ImageServerService(settingsDb, { apiSecurity?, getDiagnostics?, ...seams })`

- Throws `ImageServerService requires a SettingsDatabase` without `settingsDb`.
- `getDiagnostics()` should be LLMServerService's cached `ensureDiagnostics`, so
  both sides agree on CUDA without a probe storm. Unwired, it falls back to an
  uncached `SystemDiagnostics.gather({})` (required lazily: it loads Electron).
- Test seams, each with its production default: `appBaseDir`
  (`AppPaths.appBaseDir`), `runtimeDetector` (`ImageRuntimeDetector.shared`),
  `scanner` (new ImageModelsScanner), `vramCoordinator` (`VramCoordinator.shared`),
  `hotswap` (`HotswapCoordinator.shared`), `launchPlanner` (new ImageLaunchPlanner),
  `capabilities` (new [SdServerCapabilities](service/SdServerCapabilities.md)),
  `liveMemory` (`CudaDeviceProbe.withLiveMemory`), `findFreePort(role, opts)`
  (`VideoRuntimeServer.findFreePort` for the video slot, else
  `ImageRuntimeServer.findFreePort`), `log` (`console.log`).
- Public fields: `settingsDb`, `apiSecurity`, `runtimeServer` (generate),
  `editRuntimeServer`, `videoRuntimeServer` (a VideoRuntimeServer), `ramPin`
  (RamPinService `luma-image-ram-pin`, enabled by the `pinModelRam` default,
  target `ImagePinTarget#resolve(this)` with the service's scanner).
- Every slot gets the persisted idle timeout and is wired to the VRAM
  coordinator (`releaseOnIdle`, `markResidentOnReady`) under its role id.

## Methods

Slots:
- `slots()` `[{ role, server, defaultKey }]` for generate (`modelId`), edit
  (`editModelId`) and video (`videoModelId`). Every per-slot fan-out reads it.
- `serverForRole(role)` edit and video map to their slots; anything else is generate.
- `getApiKeyForLaunch()` `{ required, key (first key), keyCount }`; no ApiSecurity is `{ false, null, 0 }`.
- `getAutoUnloadMs()`, `setAutoUnloadMs(ms)` (applied to every slot; 0 disables).
- `shutdown()` stops every slot, warning per failure. It keeps the RAM pin: chat
  routing calls it mid-session to reclaim VRAM, and the app-quit path unpins.

Settings ([ImageServerSettings](service/ImageServerSettings.md)):
- `isEnabled()`, `setEnabled(enabled)` -> `{ success: true, enabled }`; disabling stops every slot.
- `getDefaultModelsDir()` `<base>/models/image`, `getRuntimesDir()` `<base>/runtimes/image`.
- `getModelsDirConfig()`, `setModelsDir(dir)`, `getDefaults()`, `setDefaults(patch)`.

Runtimes (ManagedRuntimeSettings, cache key `core.imageServer.runtimesViewCache`,
binaries under `core.imageServer.runtimes.<id>.manualBinaryPath`):
- `getManualRuntimeBinary`, `setManualRuntimeBinary`, `getAllManualRuntimeBinaries`,
  `getCachedRuntimesView`, `setCachedRuntimesView`, `invalidateRuntimesCache`,
  `ensureRuntimesView(opts)`.

Server selection ([ImageServerSelection](service/ImageServerSelection.md),
[RemoteImageServerStore](service/RemoteImageServerStore.md)):
- `computeLocalServerEntry(role)`, `getServerConfigs()`, `getActiveServerId(role)`,
  `setActiveServerId(role, id)`, `getActiveServer(role)`, `isRoleReady(role)`.
- `getRemoteServerConfigs()`, `saveRemoteServerConfigs(list)`, `upsertRemoteServer(entry)`,
  `setRemoteServerModel(id, modelId)`, `removeRemoteServer(id)`, `removeServersForPeer(peerId)`.
- `listInstalledModels(kind?)` ([InstalledImageModels](service/InstalledImageModels.md)).

Display names ([ImageModelDisplayNames](service/ImageModelDisplayNames.md)):
`getModelDisplayNames()`, `setModelDisplayName(key, name)`, `resolveModelDisplayName(stem)`.

Launch:
- `startServerResolved(modelIdOverride?, { role? })` runs one
  [ImageSlotLaunch](service/ImageSlotLaunch.md); resolves `{ success, status?, plan?, error? }`.

Statics: `DEFAULT_AUTO_UNLOAD_MS` (15 min), `LOCAL_GENERATE_ID`, `LOCAL_EDIT_ID`,
`RUNTIMES_CACHE_KEY`, `MANUAL_BINARY_PREFIX`, `RAM_PIN_NAME`.

## Why

sd-server is one model per process, so the generation, edit and video models
each get a supervisor, port and GPU, and a resident edit or video model never
evicts the generation model. Hand-written generate+edit lists are how the video
slot went missing from fan-outs before; `slots()` is the one table.
