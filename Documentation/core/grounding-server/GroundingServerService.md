# GroundingServerService

`core/grounding-server/GroundingServerService.js`

A second, managed llama-server that runs a small vision grounding model (Holo,
MAI-UI, UI-Venus, ...) beside the chat model. It starts on first use, unloads
when idle, and takes its card through the shared
[VramCoordinator](../shared/runtime/VramCoordinator.md) ledger. LLMService
offers it as provider `core.groundingServer`; choosing a model routes the
`visual-grounding` slot to it.

## Construction

`new GroundingServerService({ settingsDb, llmServerService, createModelDownload?,
runtimeServer?, vramCoordinator?, hotswap?, findFreePort? })`

- `llmServerService` supplies `ensureRuntimesView()`, `getDefaults().runtimeId`
  and `getModelsDirConfig().effectivePath`.
- Defaults: `ModelDownload.start` (loaded on first use), a new
  [GroundingRuntimeServer](GroundingRuntimeServer.md), `VramCoordinator.shared`,
  `HotswapCoordinator.shared`, `GroundingRuntimeServer.findFreePort()`.
- Construction sets the runtime server's idle timeout and wires
  `releaseOnIdle` and `markResidentOnReady` for server id `grounding`.
- Public fields: `settingsDb`, `llmServerService`, `runtimeServer`, `lastError`.

## Methods

- Settings ([GroundingSettings](GroundingSettings.md)): `getModelPath()`,
  `getMmprojPath()`, `getAutoUnloadMs()`, `isConfigured()`,
  `setAutoUnloadMs(ms)` (also applied to the live server).
- `setModel({ modelPath, mmprojPath? })`: an empty `modelPath` clears the
  selection and stops the server. Otherwise refuses `Model not found: <path>`
  or `No vision projector (mmproj) next to this model. A grounding model needs
  one.`, stores the choice and stops a server running a different model.
  Returns `{ success, error? }`.
- `modelFileBytes()`, `estimateVramBytes()` (files plus
  `GroundingLaunch.OVERHEAD_BYTES`), `modelFiles()` (prewarm paths); all empty
  or 0 when not configured.
- `ensureRunning()` serialized, so a burst of calls starts one child:
  - not configured: `{ success: false, code: 'NOT_CONFIGURED', error }`;
  - a ready server on the configured model: `markActive()`, `{ success: true, status }`;
  - otherwise stops a server that is neither idle nor errored, picks a runtime
    ([GroundingLaunch](GroundingLaunch.md)`.pickRuntime`), evicts a swap-pool
    sibling (`hotswap.acquire('grounding')`, errors ignored), reserves
    `{ serverId: 'grounding', role: 'grounding', requiredBytes, allowSplit: false }`,
    takes a free port and starts with a 3 minute health timeout and the
    reservation's `cudaDevice`. Any failure releases the claim, sets
    `lastError` and returns `Grounding server failed to start: <reason>`.
- `stop()` / `shutdown()` stop the child and release the claim.
- `getStatus()` the runtime server's status.
- `getView()` `{ configured, modelPath, mmprojPath, modelName, autoUnloadMs,
  state, port, lastError, recommended, download }`.
- `computeProviderEntry()` null when not configured, else `{ id:
  'core.groundingServer', type: 'openai', name: 'Grounding server (managed)',
  endpoint: 'http://127.0.0.1:<port or 0>', apiKey: null, selectedModel, models,
  managedByCore: true }`.
- `downloadRecommended(id, onEvent?)` and `cancelDownload()` via
  [GroundingRecommendedModels](GroundingRecommendedModels.md); a finished
  download selects the model through `setModel`.
- Statics: `PROVIDER_ID`, `SERVER_ID`, `ROLE`, `PROVIDER_NAME`,
  `NOT_CONFIGURED_MESSAGE`, `NO_PROJECTOR_MESSAGE`.

## Why

The chat model is picked for conversation and is often text-only or large and
slow to ground with. A dedicated 4-9B grounding model answers "where is X on
this screenshot" in about 0.8 s (calibration bench, 2026-09-30) and leaves the
chat server untouched: no projector restarts, no KV-cache loss, no port change
under a running turn. `PROVIDER_ID` is read by
[ManagedServers](../llm-service/service/ManagedServers.md) so the two can never
disagree; the download module is loaded lazily to keep that require light.
