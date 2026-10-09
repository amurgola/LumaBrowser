# MusicServerService

`core/music-server/MusicServerService.js`

Owns the music-generation subsystem: settings, the SGLang-Omni runtime view
(detect, install, update through the python-env strategy), the music model
store (HF repo snapshots under `<appBaseDir>/models/music`) and the one
[MusicRuntimeServer](server/MusicRuntimeServer.md) supervisor. Method names
mirror ImageServerService so preflight, the runtime cards and the setup engine
treat every server kind alike.

## Construction

`new MusicServerService({ settingsDb, getDiagnostics?, server?, catalog?, vramCoordinator?, hotswap?, planner?, findFreePort?, liveMemory?, platform?, settingsOptions?, runtimeOptions?, storeOptions? })`

- Throws `MusicServerService: settingsDb is required`.
- `getDiagnostics()` resolves `{ cuda, gpu }` (main passes the LLM side's cached
  probe so a warm boot spawns nothing); default `{ cuda: null, gpu: null }`.
- Test seams and defaults: a new MusicRuntimeServer, a
  [MusicModelCatalog](models/MusicModelCatalog.md), `VramCoordinator.shared`,
  `HotswapCoordinator.shared`, `new MusicLaunchPlanner({ vramCoordinator })`,
  `MusicRuntimeServer.findFreePort()`, `CudaDeviceProbe.withLiveMemory`,
  `process.platform`; `settingsOptions`, `runtimeOptions` and `storeOptions`
  pass through to [MusicServerSettings](service/MusicServerSettings.md),
  [MusicRuntimes](service/MusicRuntimes.md) and [MusicModelStore](service/MusicModelStore.md).
- Construction sets the server's idle timeout and wires `releaseOnIdle` and
  `markResidentOnReady` for server id `music`.
- Public fields: `settingsDb`, `server` (read by [MusicRouter](MusicRouter.md),
  [MusicServerGate](MusicServerGate.md) and the IPC event broadcast).

## Methods

- `isPlatformSupported()` linux and win32 only.
- Settings: `isEnabled()`, `setEnabled(v)`, `getDefaults()` (`{ modelId, seed,
  maxDurationSec, autoUnloadMs }`), `setDefaults(patch)` (also applies the idle
  timeout to the live server), `getAutoUnloadMs()`, `setAutoUnloadMs(ms)`
  (floored, at least 0, returns the stored value), `getExtraServeArgs()`,
  `getRuntimesDir()`, `getModelsDirConfig()` (`{ configuredPath, effectivePath }`).
- Runtimes: `ensureRuntimesView({ force })`, `invalidateRuntimesCache()`,
  `getManualRuntimeBinary(id)`, `setManualRuntimeBinary(id, path)`,
  `installRuntime(id, { onEvent })`, `cancelInstall()`,
  `checkRuntimeUpdates({ force })`, and `uninstallRuntime(id)`, which first stops
  a server that is not idle (errors ignored).
- Models: `getModelsView()`, `downloadModel(modelId, { onEvent })`,
  `cancelDownload()`, `deleteModel(modelId)`.
- `getStatus()` the server status.
- `startServerResolved(modelId)` resolves `{ success: true, status }` or
  `{ success: false, error }`:
  - `Unknown music model: <id>`;
  - `Music model "<id>" is not downloaded. Download it in Music Setup.`;
  - `SGLang-Omni is not installed. Install it in Music Setup.` when no installed
    runtime row is in the model's `compatibleRuntimes`;
  - otherwise evicts the swap-pool sibling (`hotswap.acquire('music')`, errors
    ignored), takes a free port, overlays live per-card memory on the
    diagnostics, plans with [MusicLaunchPlanner](server/MusicLaunchPlanner.md)
    (`runtimeRow, model, modelPath, port, extraServeArgs, settingsDb,
    diagnostics`), starts the server and reapplies the idle timeout. Any throw
    releases the `music` VRAM claim and returns its message.
- `stopServer()` resolves `{ success: true, status }`.
- `shutdown()` cancels a download and an install, stops the server and
  unsubscribes the VRAM release hook.
- Statics: `SERVER_ID`, `SUPPORTED_PLATFORMS`, `NOT_INSTALLED_MESSAGE`.

## Why

The swap pool's card holds one model at a time, so the occupant is evicted
before the planner reserves against the ledger; an un-evicted sibling would push
the reservation to the RAM tier, which the music planner refuses. The persisted
diagnostics are a cache, so placement overlays what the cards hold now. The
`{ success, error }` contract matches ImageServerService so routers share error
handling. It shares no base class with TtsServerService or WhisperServerService:
it is a managed-runtime service over an HTTP supervisor, not a worker or backend
dispatcher; its natural sibling is ImageServerService (not ported yet).
