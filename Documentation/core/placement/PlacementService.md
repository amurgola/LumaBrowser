# PlacementService

`core/placement/PlacementService.js`

Backs the unified placement canvas (LLM settings, Advanced tab): where each
managed model (LLM, image generate, edit and video, music, grounding) lands
across GPUs, RAM and peer GPUs, starting and stopping that layout, the VRAM
snapshot the canvas draws, and the cat-and-hat test that measures real
footprints. [PlacementIpcHandlers](PlacementIpcHandlers.md) routes
`core.placement.*` to it.

## Construction

`new PlacementService({ settingsDb, llmServerService, imageServerService,
musicServerService?, groundingServerService?, getAgentDeps?, ...seams })`

- `settingsDb` is required (`PlacementService requires settingsDb`). Music is
  optional (absent where it can never run); `getAgentDeps()` supplies
  `{ artifactStore }` for the test's artifact fallback.
- Seams with production defaults: `getChatRouter` (`global.__lumaChatRouter`),
  `getSharingClient` (`global.__lumaSharingClientService`), `hotswap`
  (`HotswapCoordinator.shared`), `vram` (`VramCoordinator.shared`), `gpu`
  (`CudaDeviceProbe`), `rss` (`ProcessMemory`), `totalMemory` (`os.totalmem`),
  `musicCatalog` (`new MusicModelCatalog()`), `imageScanner` (an
  `ImageModelsScanner`, loaded on first scan) and `getLauncher`
  (`ServerLauncher.shared`, loaded on first start).
- Construction registers every server for hotswap eviction and pushes the
  stored layout's pools ([HotswapWiring](service/HotswapWiring.md)).

## Methods

- `getConfig()` -> `{ layout, measured, measuredCurrent, canApply, autoStart, autoStopMs }`
  ([PlacementGate](service/PlacementGate.md) for the last three).
- `setConfig({ layout?, autoStart?, autoStopMs? })` normalizes and saves (always
  allowed: the gate blocks allocation, not editing), floors `autoStopMs` at 0,
  applies it to the LLM, image and music services, reconfigures hotswap pools
  and, with any pool, warms it in the background. Returns `getConfig()`.
- `autoArrange()` saves the all-automatic layout and returns `getConfig()`.
- `getMeasured()` the [measured footprints](service/MeasuredFootprintStore.md).
- `isAvailable()` true when the LLM has `runtimeId` and `modelPath` and the
  image service `runtimeId` and `modelId`.
- `async getHotswapInfo()` -> `{ totalBytes, poolBytes, requiredBytes, reserveBytes,
  viable, suggestedCard, models, estimated }`: [PoolModels](service/PoolModels.md)
  sizes through `HotswapRamGate.evaluate`; `suggestedCard` is the largest-VRAM
  CUDA card, or null.
- `async getVramSnapshot()` see [VramSnapshotBuilder](service/VramSnapshotBuilder.md).
- `startAll()`, `stopAll()` see [PlacementLifecycle](service/PlacementLifecycle.md).
- `maybeAutoStart()` applies the auto-stop, then starts the layout only when
  `autoStart` is on and `isAvailable()`: `{ success: true, started }`.
- `runTest(send)` see [PlacementTestRun](service/PlacementTestRun.md).

## Why

The class is a facade: each concern sits in `service/` so it can be tested
alone. The layout schema and its store are shared runtime classes
([PlacementLayout](../shared/runtime/PlacementLayout.md),
[PlacementStore](../shared/runtime/placement/PlacementStore.md)) because
VramCoordinator and HotswapCoordinator read the same layout.
