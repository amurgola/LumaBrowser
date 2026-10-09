# TensorParallelGate

`core/llm-server/server/launch/TensorParallelGate.js`

The static eligibility of the opt-in tensor-parallel split (`--split-mode tensor`).

## Methods

- `TensorParallelGate.resolve({ overrides, flags, gguf, rpcEnabled, gpuCount })`
  returns `{ requested, staticOk, whyOff }`.
  - `requested`: `overrides.tensorSplitMode` without `manualTensorSplitActive`;
  - `staticOk`: requested, a CUDA runtime, `--split-mode` and flash attention
    accepted, a dense model (`expertCount <= 1`), no RPC, 2+ cards, and build
    9000+ (or the luma fork);
  - `whyOff`: the first failing reason in the order CUDA runtime, flash attention,
    `--split-mode`, dense, 2+ GPUs, build floor, else `preconditions not met`.

## Why

Tensor parallelism keeps every card on the same tensors, a real decode win on a
fast/slow pair (5090 + 3090: ~70 to 100+ t/s), but it is CUDA-only, needs flash
attention and an f16 KV cache, processes prompts several times slower, helps only
dense fully-resident models, and has a known CUDA-graph VRAM leak, so it is
opt-in. The full-offload half of the gate is applied after the budget
([SplitPlan](SplitPlan.md)); LaunchPlanner forces f16 KV as soon as `staticOk`.
