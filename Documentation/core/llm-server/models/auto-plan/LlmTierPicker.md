# LlmTierPicker

`core/llm-server/models/auto-plan/LlmTierPicker.js`

Picks the chat model for [AutoPlanner](../AutoPlanner.md). A pick is
`{ model, quant, contextSize, kvCacheType, vramNeedBytes, weightsBytes, mode }`
(`mode` `gpu`, `moe-cpu` with `cpuMoe: true`, `partial` or `cpu`).

## Methods

- `pick(models, machine, hw, { cpuMoeSupported = true })` runs the tiers for an
  [AutoPlanMachine](AutoPlanMachine.md): on a GPU box full residency, upgraded to
  a MoE offload pick when the resident pick is below `large` and the sparse one
  out-tiers it; then partial (GPU boxes); then CPU.
- `fullVram(models, vramBudget)` tier 1: most capable model, best quant, then the
  longest context and f16 before q8_0 KV, whose `weights + KV + 1 GB` fit. Null at
  or under 1.5 GB.
- `moeOffload(models, vramBudget, ramBudget)` tier 2: MoE models whose weights fit
  85% of RAM and whose `weights x 0.15 + KV + 1 GB` fit VRAM.
- `partial(models, ramBudget, hasGpu)` tier 3: biggest Q4_K_M under 85% of RAM at
  16K (`partial`, or `cpu` without a GPU); else the smallest model at 8K (`cpu`).
- `cpu(models, ramBudget, hw)` tier 4: biggest MoE and biggest dense Q4_K_M under
  80% of RAM; the MoE wins unless both speeds are predicted and the dense one is
  faster; else the smallest model. 16K, f16.

## Why

Quant is tried before context: a smaller context at Q8_0 beats a long one at
Q4_K_M. CPU decode tracks active params, so sparse models are preferred on CPU,
but the rule is only a proxy: a real speed prediction settles it.
