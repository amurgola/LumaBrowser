# LlmDiagnosticsCache

`core/llm-server/service/LlmDiagnosticsCache.js`

The persisted system-diagnostics snapshot, probed only on a cache miss or a
forced reload, with concurrent callers sharing one probe.

## Methods

- `new LlmDiagnosticsCache({ settingsDb, smiPath, gather, invalidateRuntimes })`;
  `smiPath` is [NvidiaSmiPathSettings](NvidiaSmiPathSettings.md), `gather(opts)` is
  `SystemDiagnostics.gather`, `invalidateRuntimes()` drops the runtimes view.
- `getCached()` the stored object (with `_cachedAt`), or null.
- `setCached(data)` stores it stamped with `_cachedAt`; null deletes.
- `ensure({ force = false })`:
  - not forced: serve the cache unless it records a transient CUDA failure
    (`CudaSnapshot.isTransientCudaFailure`), overlaying the current
    `cuda.pathHintDismissed`; else join the in-flight probe; else probe;
  - a probe calls `gather({ savedNvidiaSmiPath })`, invalidates the runtimes view
    when CUDA availability flipped against the cache, saves a newly
    `cuda.discoveredPath`, overlays the hint flag and persists the result;
  - `force` always probes (not shared) and then invalidates the runtimes view.
  - A rejected probe is not cached.
- `STORAGE_KEY` `core.llmServer.diagnosticsCache`.

## Why

The probe spawns nvidia-smi and several PowerShell children and kept the window
busy for seconds; running it on every LLM-tab load stalled the browser, and boot
fired several callers at once. A transient failure (an NVML mismatch after a
driver update) usually heals with a reboot, so serving it from cache would
report "no CUDA" forever. Runtime readiness pills key off this snapshot, hence
the invalidations.
