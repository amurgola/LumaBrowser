# ServerLauncher

`core/llm-server/server/ServerLauncher.js`

Starts the local llama-server from the user's persisted defaults. The Start
button, the fit test's restart, chat auto-start, the placement tab and the
extension manager all go through it, so they honour the same context, KV,
placement and peer choices and fail with the same messages.

## Methods

- `ServerLauncher.shared` the instance over the process-wide collaborators.
- `new ServerLauncher({ planFor, catalog, detector, scanner, diagnostics, vram,
  hotswap, rpcPeers, findFreePort, freeMemory, lending, log })` (all optional) for
  tests. Defaults: `PlanFor.shared`, `LlmRuntimeCatalog.shared`,
  `LlmRuntimeDetector.shared`, `LlmModelsScanner.shared`, `SystemDiagnostics`,
  `VramCoordinator.shared`, `HotswapCoordinator.shared`, `RpcPeers`,
  `LlmRuntimeServer.findFreePort`, `os.freemem`, `() => global.__lumaRpcLending`,
  `console`.
- `resolveAndStart(llmServerService, { withVision })` resolves:
  - `{ success: true, status, plan }` after `runtimeServer.start(launch)`, plus
    `flagRescue: '<flag>'` or `oomRescue: true` when a rescue relaunched;
  - a refusal `{ success: false, error }`, with `code: 'RUNTIME_NOT_INSTALLED'`
    (and `runtimeId`, `runtimeName`, `installable`) or
    `code: 'MODEL_RUNTIME_MISMATCH'` where the UI acts on it.
  A start failure no rescue covers rejects with the original error.

The service needs `getDefaults`, `settingsDb`, `runtimeServer`
(`getStatus`, `ensureStopped`, `start`), `getModelsDirConfig`,
`syncQueueConcurrency`, and either `ensureDiagnostics`/`ensureRuntimesView` or
`getSavedNvidiaSmiPath`/`getRuntimesDir`/`getAllManualRuntimeBinaries`. Optional:
`getApiKeyForLaunch`, `resolveModelLaunchFlags`, `getFitResults`, `ramPin`.

## Flow

[LaunchRun](launcher/LaunchRun.md) runs one start over a
[LaunchContext](launcher/LaunchContext.md):

1. Refuse a missing default runtime or model.
2. `ensureStopped()` unless already `ready` (a crashed-but-alive child would
   stack a second model).
3. Start the hotswap reclaim (`hotswap.acquire('llm')`) in parallel with the preflight.
4. [LaunchPreflight](launcher/LaunchPreflight.md): diagnostics, runtime row,
   learned unsupported flags, scanned model, [ModelRuntimeMatch](launcher/ModelRuntimeMatch.md), API key.
5. Free port, then [LaunchOverrides](launcher/LaunchOverrides.md) (defaults,
   [LlmLayoutIntent](launcher/LlmLayoutIntent.md), measured fit).
6. MLX and extension runtimes (`PlanFor#isCustomLaunch`) plan and start here.
7. Wait up to 30 s for GPUs lent to a peer (`lending.waitUntilFree(30000)`).
8. [PeerGpuBorrow](launcher/PeerGpuBorrow.md), then join the hotswap reclaim and
   log the preflight timings.
9. [LlmPlacement](launcher/LlmPlacement.md): probe plan, VRAM reservation, real plan
   against the reserved cards. A plan failure returns borrowed GPUs.
10. Expert offload beats borrowing: a plan with `cpuMoe` after a borrow returns the
    peers and replans local-only (`rpcSkippedMoeOffload`).
11. [LaunchFinalizer](launcher/LaunchFinalizer.md), start, sync the queue.
12. On a start failure: return borrowed GPUs, then [FlagRescue](launcher/FlagRescue.md)
    or [OomRescue](launcher/OomRescue.md) (one attempt each), else rethrow.

## Why

Preflight reads the service's caches, not fresh probes: probing cost 3.5-5.7 s of
nvidia-smi and `--version` spawns per launch, the bulk of a singularity swap's
dead air. The planner is called twice on the llama.cpp path (a probe to size the
card pick, then the real plan against only the picked cards) because planning
against the whole box while the child sees a subset would over-offload and OOM.
