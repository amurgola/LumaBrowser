# NvidiaSmi

`core/shared/runtime/NvidiaSmi.js`

The one place that resolves and runs nvidia-smi, so every GPU probe uses the
same binary even where it is not on PATH. Parsing is in
[NvidiaSmiOutputParser](NvidiaSmiOutputParser.md); continuous readings come
from [NvidiaSmiStream](NvidiaSmiStream.md), which owns one long-lived loop over
this binary. Every call here is asynchronous: nothing on this path blocks the
main process.

## Methods

- `NvidiaSmi.setSmiPath(path)` publishes the binary to use. Trimmed; a blank,
  whitespace or non-string value clears it. Listeners hear a real change only.
- `NvidiaSmi.smiPath()` returns the published path, or the bare `nvidia-smi`.
  `hasExplicitPath()` tells whether one was published.
- `NvidiaSmi.onPathChange(listener)` calls `listener(effectivePath)` on every
  change; returns the unsubscribe function. A throwing listener is swallowed.
- `NvidiaSmi.findOnDisk()` resolves the first existing candidate for this
  platform, or `null`. Does not test execution.
- `NvidiaSmi.query(args, { timeoutMs, now })` one run, classified:
  `{ ok, stdout, stderr, outcome }` with `outcome` an
  [NvidiaSmiOutcome](nvidia-smi/NvidiaSmiOutcome.md) record (`ok`, `missing`,
  `timeout`, `exit`). Never rejects.
- `NvidiaSmi.queryGpuCount()`, `queryGpus()`, `queryComputeApps()` convenience
  one-shots over `query`; a failure reads as an empty result (0, `[]`, `{}`).
  Callers that must tell a hung binary from an absent one use `query` or the
  stream.
- `NvidiaSmi.streamArgs(intervalMs)` the looping form of `GPU_ARGS`
  (`-lms <ms>`, floored at 100 ms); `spawnOptions()` the hidden-window, piped
  spawn options the stream uses.
- `NvidiaSmi.CANDIDATES_WIN`, `NvidiaSmi.CANDIDATES_POSIX` are the on-disk
  ladders (System32, NVSMI under Program Files and ProgramW6432, `CUDA_PATH/bin`;
  `/usr/bin`, `/usr/local/bin`, `/usr/local/cuda/bin`, `/opt/cuda/bin`). Built
  from environment variables when the module loads.
- `NvidiaSmi.TIMEOUT_MS` (4000), `BARE_NAME`, `COUNT_ARGS`, `GPU_ARGS`
  (`index,pci.bus_id,name,memory.total,memory.free`), `APPS_ARGS`.

The synchronous queries (`queryGpusSync` and siblings) are gone: placement reads
go through the stream's cached snapshot instead.

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
fallback keeps hosts with nvidia-smi on PATH working before diagnostics runs,
and `onPathChange` lets the stream move to the published binary without a
restart.

`index` and `pci.bus_id` lead the GPU query so a card is identified by itself:
a malformed line drops only its own card instead of shifting the next one.
