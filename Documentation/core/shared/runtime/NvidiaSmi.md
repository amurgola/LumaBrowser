# NvidiaSmi

`core/shared/runtime/NvidiaSmi.js`

The one place that resolves and runs nvidia-smi, so every GPU probe uses the
same binary even where it is not on PATH. Parsing is in
[NvidiaSmiOutputParser](NvidiaSmiOutputParser.md).

## Methods

- `NvidiaSmi.setSmiPath(path)` publishes the binary to use. Trimmed; a blank,
  whitespace or non-string value clears it.
- `NvidiaSmi.smiPath()` returns the published path, or the bare `nvidia-smi`.
- `NvidiaSmi.findOnDisk()` resolves the first existing candidate for this
  platform, or `null`. Does not test execution.
- `NvidiaSmi.queryGpuCountSync()` / `queryGpuCount()` return the GPU count.
- `NvidiaSmi.queryGpusSync()` / `queryGpus()` return the per-card memory rows.
- `NvidiaSmi.queryComputeAppsSync()` / `queryComputeApps()` return the
  `{ pid: bytes }` map.
- `NvidiaSmi.CANDIDATES_WIN`, `NvidiaSmi.CANDIDATES_POSIX` are the on-disk
  ladders (System32, NVSMI under Program Files and ProgramW6432, `CUDA_PATH/bin`;
  `/usr/bin`, `/usr/local/bin`, `/usr/local/cuda/bin`, `/opt/cuda/bin`). Built
  from environment variables when the module loads.
- `NvidiaSmi.TIMEOUT_MS` (4000), `BARE_NAME`, `COUNT_ARGS`, `GPU_ARGS`,
  `APPS_ARGS`.

Every query returns an empty result (0, `[]`, `{}`) when the binary is missing,
times out or errors, so a host without nvidia-smi reads as "no GPUs" and never
crashes a boot path.

## Why

nvidia-smi is often not on PATH, mostly on Windows where a truncated System32
entry is common. LLM diagnostics had an eight-location resolution ladder for
this, while every cudaPin probe shelled out to the bare name and so failed
closed and silently on exactly those hosts: an empty placement canvas, skipped
multi-GPU behaviour, and the hotswap VRAM-reclaim wait degrading to a flat
sleep (the cause of roughly half the swap OOMs). RpcLendingService had papered
over it with a local retry through the diagnostics snapshot.

Ownership: LLM diagnostics is the producer. It keeps the UI-facing PATH hint
and remediation, runs its probe, and publishes the winner here with
`setSmiPath` (as does the settings handler when the user picks a path). This
class owns resolution and invocation; everything else consumes. The bare-name
fallback keeps hosts with nvidia-smi on PATH working before diagnostics runs.

The async twins exist because the fit test samples on a 350 ms loop and must
not block.
