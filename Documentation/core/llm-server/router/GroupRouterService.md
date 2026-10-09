# GroupRouterService

`core/llm-server/router/GroupRouterService.js`

The opt-in tool-group router: a Qwen3-0.6B fine-tune kept resident on CPU in
its own llama-server ([RouterRuntimeServer](RouterRuntimeServer.md)) that tells
the chat agent which lazy tool groups a message needs before the main model runs.

## Methods

- `new GroupRouterService({ settingsDb, llmServerService })`. Test seams:
  `modelDir` (function), `runtimeServer`, `ramPin`, `client`, `downloader`, `cpuCount`.
  Construction is free: no process starts until `apply()`.
- Settings ([GroupRouterSettings](GroupRouterSettings.md)): `isEnabled`,
  `isPinEnabled`, `setEnabled`, `setPinEnabled`, `getModelDir`, `getModelPath`,
  `isModelInstalled`.
- `isReady()` the server is `ready`.
- `getStatus()` `{ enabled, pinRam, modelPath, modelInstalled, state, port,
  runtimeId, download: { received, total } | null, lastLatencyMs, error, pin }`;
  `error` is `lastError`, else the server's, else null; `pin` is the RAM pin status.
- `apply()` reconciles server and pin with the settings; serialized, never
  rejects (a failure lands in `lastError` and is logged). Disabling cancels an
  in-flight download first.
  - disabled: stop the server, apply the pin (it releases), clear the error;
  - enabled, model missing and no path override: download it first; stop if
    switched off meanwhile;
  - still missing: stop the server, keep the download error or report
    `Router model not installed (expected <path>).`, apply the pin;
  - otherwise pin first (so the mmap load reads locked pages), then start
    unless `ready` or `starting`.
- `downloadModel({ indexUrl? })` true when the verified model is installed;
  never throws; failures set `lastError` to `Router model download failed: <reason>`.
- `classify(message, { timeoutMs = 1500 })` the group keys (`[]` for none), or
  null when disabled, not ready, slow or failed. Records `lastLatencyMs`.
- `stop()` stops server and pin, ignoring errors (quit path).
- `DEFAULT_TIMEOUT_MS` 1500, `PRIME_TIMEOUT_MS` 10000.

## Start

The runtime comes from `llmServerService.ensureRuntimesView()` through
[RouterLaunchPlan](RouterLaunchPlan.md), the port from
`RouterRuntimeServer.findFreePort()`, and the launch is CPU-only with GPUs hidden.
After `ready` one `classify('hello')` primes the prompt cache with the static system block.

## Pin

A [RamPinService](../../shared/runtime/rampin/RamPinService.md) named
`luma-router-ram-pin`, enabled only when both settings are on, pinning the one
model file (`modelName: 'Tool router'`; `Router model not found at <path>.` when absent).

## Why

F1 0.93 against the GROUP_INTENT regex's 0.51 on the blind 220-message set, about
100 ms per call on CPU because the system block stays in the prompt cache. It can
only add groups (the bridge unions its answer with the regex), so an unavailable
or slow router degrades to the behaviour without it. The server is never
idle-unloaded while enabled.
