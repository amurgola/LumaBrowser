# LaunchFinalizer

`core/llm-server/server/launcher/LaunchFinalizer.js`

Decorates a planned launch with what the planner does not know.

## Methods

- `new LaunchFinalizer({ vram })`.
- `finalize(ctx, launch)` mutates and returns the launch: `authKey`, `cudaDevice`,
  `extraEnv` ([OpenVinoDevice](../../runtimes/OpenVinoDevice.md)`.spawnEnv(ctx.runtime.spawnEnv, ctx.openvinoDevice)`:
  the runtime's own variables with `GGML_OPENVINO_DEVICE` set when a device was
  resolved, else `ctx.runtime.spawnEnv` or null), `healthTimeoutMs`; appends `--tensor-split <ctx.tensorSplit>` (and sets
  `plan.tensorSplit`) when the split has 2+ entries, no peers are borrowed and the
  args do not already carry one; then calls `vram.setSplit('llm', weights)` (best effort): the layer count per card from
  `plan.layerSplit.perDevice` when the plan has one, else whatever `--tensor-split` ships.
- `LaunchFinalizer.healthTimeoutMs(weightsTotalBytes)` is
  `min(20 min, max(5 min, 120 s + round(bytes / 200000)))` ms, that is 200 MB/s.
- Constants `HEALTH_TIMEOUT_MIN_MS`, `HEALTH_TIMEOUT_MAX_MS`, `HEALTH_WARMUP_MS`,
  `LOAD_BYTES_PER_SEC`.

## Why

The flat 5-minute health wait dies under a 150+ GB model (bulk read or LAN
streaming); the wait still ends the moment the child exits. The ledger weighting
debits each card by what the LLM really puts there, not half and half. It reads the
plan's per-card layers first because a slowest-first `--tensor-split` lists the cards in
llama.cpp's device order, not the ledger's.
`extraEnv` is how a runtime's declared environment (OpenVINO's device) reaches
the spawned child via `RuntimeSpawnEnv`.
