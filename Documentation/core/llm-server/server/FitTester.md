# FitTester

`core/llm-server/server/FitTester.js`

The empirical model-fit test. The picker's "GPU fit by context" matrix is an
estimate; this loads the model at each context rung and each offered KV mode,
asks for about 100 words, and records the real VRAM, RAM and generation speed.

## Methods

- `FitTester.shared` the instance over `PlanFor.shared` and `LlmRuntimeCatalog.shared`.
- `new FitTester({ planFor, catalog, comboRunner })` (all optional) for tests.
- `run({ model, runtime, diagnostics, resolveDevice, apiKey, onProgress, shouldCancel, priorFit })`
  resolves `{ ok: true, canceled, results }`, one row per finished combo
  (see [FitComboRunner](fit-test/FitComboRunner.md) for the row).
  - Throws for no model, a runtime without `binaryPath`, a runtime whose
    `unsupportedFlags` include `--flash-attn`, an MLX runtime, and an extension
    runtime with its own planner.
  - `resolveDevice(requiredBytes)` returns a `CUDA_VISIBLE_DEVICES` string or null,
    per combo.
  - `priorFit` (the stored fit entry) seeds each combo with its prior measurement.
  - `apiKey` must match the running server's key; an empty string counts as none.
  - Progress events `{ phase, index, total, combo, result }`: `start` (index 0,
    total up front), `combo-start`, `combo-done` (index + 1, the row), `canceled`
    (the index it stopped at) or `done`.
- `FitTester.CTX_LADDER`, `KV_VARIANTS` (`['f16', 'q8_0']`), `DEPTH_TARGET_TOKENS`
  (16384), `DEPTH_MIN_CTX` (20480).

## Flow

[FitComboLadder](fit-test/FitComboLadder.md) builds the combos and marks the
depth-probe combo; for each one, unless cancelled,
[FitComboRunner](fit-test/FitComboRunner.md) measures it on a fresh supervisor.
[FitRunSignals](fit-test/FitRunSignals.md) guards the caller's hooks.

## Why

One server at a time: VRAM is the bottleneck, and parallel combos would OOM and
pollute each other's measurements. Ephemeral supervisors, so the app's own chat
server and its broadcasts are untouched (the caller stops and restarts it). Flash
attention is forced, as a quantized KV cache requires and for one measurement
basis. Fail-soft per combo: an OOM or timeout is a failed row and the run moves on.

MLX and extension runtimes are refused because every combo plans through the
llama.cpp planner: the run would persist a ladder of guaranteed-failed rows,
which the picker prefers over its correct estimate (bug H12 residual).
