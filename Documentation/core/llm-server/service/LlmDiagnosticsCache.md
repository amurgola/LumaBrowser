# LlmDiagnosticsCache

`core/llm-server/service/LlmDiagnosticsCache.js`

The persisted system-diagnostics snapshot, probed only on a cache miss or a
forced reload, with concurrent callers sharing one probe.

## Methods

- `new LlmDiagnosticsCache({ settingsDb, smiPath, gather, invalidateRuntimes, getRuntimesDir = null })`;
  `smiPath` is [NvidiaSmiPathSettings](NvidiaSmiPathSettings.md), `gather(opts)` is
  `SystemDiagnostics.gather`, `invalidateRuntimes()` drops the runtimes view,
  `getRuntimesDir()` is where managed runtimes install (so the probe can ask an
  installed llama.cpp build for its devices).
- `getCached()` the stored object (with `_cachedAt` and `_schema`), or null.
- `setCached(data)` stores it stamped with `_cachedAt` and `_schema: SCHEMA`; null deletes.
- `ensure({ force = false })`:
  - not forced: serve the cache unless its `_schema` is not the current
    `SCHEMA` or it records a transient CUDA failure
    (`CudaSnapshot.isTransientCudaFailure`), overlaying the current
    `cuda.pathHintDismissed`; else join the in-flight probe; else probe;
  - a probe calls `gather({ savedNvidiaSmiPath, runtimesRoot })` (`runtimesRoot`
    from `getRuntimesDir()`, else null), invalidates the runtimes view
    when CUDA availability flipped against the cache, saves a newly
    `cuda.discoveredPath`, overlays the hint flag and persists the result;
  - `force` always probes (not shared) and then invalidates the runtimes view.
  - A rejected probe is not cached.
- `STORAGE_KEY` `core.llmServer.diagnosticsCache`.
- `SCHEMA` `3`, bumped whenever the snapshot's meaning changes. 2: Apple
  Silicon unified memory, Linux sysfs VRAM and integrated-GPU shared memory
  count as VRAM. 3: NPUs, and Linux VRAM from an installed llama.cpp build's
  device list.

## Why

The probe spawns nvidia-smi and several PowerShell children and kept the window
busy for seconds; running it on every LLM-tab load stalled the browser, and boot
fired several callers at once. A transient failure (an NVML mismatch after a
driver update) usually heals with a reboot, so serving it from cache would
report "no CUDA" forever. A snapshot taken before a meaning change (an old one
reporting 0 VRAM on a Mac) would otherwise keep planning `-ngl 0`, so an
unstamped or older snapshot is re-probed rather than served. Runtime readiness pills key off this snapshot, hence
the invalidations.
