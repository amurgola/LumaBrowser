# LaunchFinalizer

`core/llm-server/server/launcher/LaunchFinalizer.js`

Decorates a planned launch with what the planner does not know.

## Methods

- `new LaunchFinalizer({ vram })`.
- `finalize(ctx, launch)` mutates and returns the launch: `authKey`, `cudaDevice`,
  `healthTimeoutMs`; appends `--tensor-split <ctx.tensorSplit>` (and sets
  `plan.tensorSplit`) when the split has 2+ entries, no peers are borrowed and the
  args do not already carry one; then calls `vram.setSplit('llm', ratios)` with
  whatever `--tensor-split` ships (best effort).
- `LaunchFinalizer.healthTimeoutMs(weightsTotalBytes)` is
  `min(20 min, max(5 min, 120 s + round(bytes / 200000)))` ms, that is 200 MB/s.
- Constants `HEALTH_TIMEOUT_MIN_MS`, `HEALTH_TIMEOUT_MAX_MS`, `HEALTH_WARMUP_MS`,
  `LOAD_BYTES_PER_SEC`.

## Why

The flat 5-minute health wait dies under a 150+ GB model (bulk read or LAN
streaming); the wait still ends the moment the child exits. The ledger weighting
debits each card by what the LLM really puts there, not half and half.
