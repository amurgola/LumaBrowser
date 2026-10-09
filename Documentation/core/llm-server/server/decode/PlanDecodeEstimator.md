# PlanDecodeEstimator

`core/llm-server/server/decode/PlanDecodeEstimator.js`

Predicts plain decode speed for one resolved llama.cpp launch plan.

## Methods

- `PlanDecodeEstimator.estimate(input)` returns
  `{ at8k, at32k, atFull, fullTokens, samples, fixedMs, source, confidence,
  speculative: 'excluded', domains }` or `null`. It never throws. `input` is what
  the launch planner already knows:
  - `gguf` (parsed header: `blockCount`, `expertCount`, `expertUsedCount`),
    `modelBytes`, `moeSplit` (MoeEstimator result or null);
  - `cpuMoe` (`{ nCpuMoe, tensorSplit }` when expert offload is on; `nCpuMoe`
    null means every layer's experts are in RAM);
  - `perGpu` (`[{ name, totalBytes, remote? }]`), `fullOffload`, `ngl`,
    `partial`, `layerFill`, `tensorSplit` (bool), `contextSize`, `kvOnHost`,
    `diagnostics` (for RAM bandwidth);
  - `kvAtLayer(block, depth)` (KV bytes one block reads at a depth) and
    `hasKvAt(block)` (false for recurrent blocks; null for non-hybrid models).
- `samples` are the depths 8192 and 32768 below the context, then the context.
- `domains[]` summarise each memory domain:
  `{ name, kind: 'gpu'|'cpu', remote, weightBytesPerToken, historyBytesPerTokenAtFull, bandwidthGbps, bandwidthSource }`.
- `confidence` is `'low'` with any floor bandwidth or an unknown expert count,
  `'moderate'` for MoE, hybrid, CPU-executing, tensor-split or RPC plans, else `'high'`.
- Constants: `RECURRENT_STATE_BYTES_PER_BLOCK` (2 MB), `DEFAULT_EXPERTS_USED` (4),
  `SAMPLE_DEPTHS`.
- `null` when the header, model size or `kvAtLayer` is missing, or anything throws.

## How bytes are charged

Executed tensors, not stored ones: every dense tensor streams, a routed-expert
tensor streams only K of N experts (`ceil(bytes x K / N)`), host-side lookup
tables stream nothing, and a recurrent block reads and writes a fixed state
regardless of depth. History grows with depth on a full-attention layer (the
caller's `kvAtLayer` saturates sliding-window layers) and is zero on a recurrent
block.

Placement follows the plan: llama.cpp offloads the last n blocks, split across
GPUs by [GpuLayerAssignment](GpuLayerAssignment.md); remaining blocks are on the
CPU; `--cpu-moe` / `--n-cpu-moe` move routed experts to RAM; `--no-kv-offload`
puts the history in RAM. Domains in a pipeline add up; a tensor split is
parallel with a per-layer sync. The formula itself is [DecodeFormula](DecodeFormula.md).
