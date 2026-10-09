# MoeExpertPlan

`core/llm-server/server/launch/MoeExpertPlan.js`

MoE expert offload (`--cpu-moe` / `--n-cpu-moe`) for one launch.

## Methods

- `MoeExpertPlan.resolve(state)` returns the plan instance with `cpuMoeRequested`,
  `cpuMoeFlagSupported`, `moeSplit` ([MoeEstimator](../../models/MoeEstimator.md)),
  `moeHostBytes`, `moeExact`, `fullWeightsEstimatedBytes`, `cpuMoeAuto`,
  `cpuMoeEnabled`, `nCpuMoe`, `gpuExpertLayers`, `perLayerExpertBytes`,
  `expertBytesAt(i)`, `residentBytesAt(i)`, `tensorSplitRatio`,
  `budgetWeightsBytes`, `cpuExpertBytes`, `cpuPoolBytes`.
- `expertBytesRange(from, to)`: routed-expert bytes of layers `[from, to)`.
- `FILL_SAFETY` (0.85), `FILL_SAFETY_EXACT` (0.93).

## Steps

1. Engage on request, or automatically when the model is MoE, the flag is
   accepted, there is VRAM, `noAutoCpuMoe` is not set, and the whole file (less
   host-side embeddings, priced without `--swa-full`) exceeds the budget.
2. Fill: spare VRAM after the resident share and KV, times the safety, goes to
   whole layers' experts from the last block backwards. If every expert fits,
   offload is switched off (it would only slow decode).
3. Balance: on 2+ local cards without a manual split, [MoeLayerSplit](MoeLayerSplit.md)
   may demote more layers; `nCpuMoe` follows it.
4. Budget weights: resident + GPU-side experts (never more than the file), then
   the CPU pool (offloaded experts + host embeddings) for the RAM policy.

## Why

Each token routes through a few experts, so experts in RAM decode far faster
than spilling whole layers. All-experts-in-RAM would leave spare VRAM idle, so the
tail layers' experts ride on the GPU. Exact per-layer bytes from the tensor scan
(real layers differ: 1.46-1.90 GB on Flash-Next) earn a tighter safety than the
header ratio's even spread; Flash-Next's compute scratch beyond weights + KV
measured 2.7 GB at 8k to 4.9 GB at 128k.
