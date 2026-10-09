# MoeLayerSplit

`core/llm-server/server/launch/MoeLayerSplit.js`

The byte-balanced `--tensor-split` for an MoE expert fill on several GPUs.

## Methods

- `MoeLayerSplit.balance({ perGpu, gguf, contextSize, cacheTypeK, cacheTypeV, kvOnHost, expertBytesAt, residentBytesAt, nCpuMoe })`
  returns `{ ratio, nCpuMoe }` (per-device layer counts) or `null`.
  - layer cost = resident bytes + KV share (`total / kvLayers` on attention blocks,
    0 on recurrent ones, `total / blocks` otherwise) + its experts once `i >= n`;
  - card budget = `(total - 1 GiB reserve - 512 MiB / cards) x CARD_SAFETY (0.92)`;
  - packs contiguously in device order, trying `n = nCpuMoe, nCpuMoe + 1, ...`;
    null when nothing packs or only `n = blocks` packs.

## Why

llama.cpp's default split hands each device a contiguous run of layers by count.
Under `--n-cpu-moe N` the first N layers are expert-stripped and the last
`blocks - N` carry their experts, about an order of magnitude heavier, so a count
split lands every heavy layer on the last card and OOMs it. When the tail does not
fit, one more layer's experts are demoted and the caller keeps its flag and budget
in step with the returned `nCpuMoe`.
