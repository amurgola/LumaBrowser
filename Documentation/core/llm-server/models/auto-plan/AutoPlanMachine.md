# AutoPlanMachine

`core/llm-server/models/auto-plan/AutoPlanMachine.js`

Reduces the hardware budget and CUDA device list to the facts
[AutoPlanner](../AutoPlanner.md) plans against.

## Methods

- `AutoPlanMachine.describe(hw, devices)` returns
  `{ vramTotal, ramUsable, ramTotal, gpu, tier, cards, largestCardBytes, cudaCards, largestCudaCard }`:
  - `vramTotal`, `ramUsable`, `ramTotal` from `usableVramBytes`, `usableRamBytes`,
    `ramTotalBytes`, floored at 0;
  - `gpu` is `vramTotal > HardwareTiers.minGpuBytes()` (1.5 GiB);
  - `cards` are the per-card `gpus[].maxBytes`, else `[vramTotal]` with a GPU, else `[]`;
  - `cudaCards` are device rows with an integer `index`; `largestCudaCard` the one
    with the most `totalBytes`, or null;
  - `tier` is `HardwareTiers.classify(hw)`.
