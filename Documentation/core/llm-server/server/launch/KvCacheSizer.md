# KvCacheSizer

`core/llm-server/server/launch/KvCacheSizer.js`

Prices the KV cache of a GGUF model in bytes for a context length and K/V precision.

## Methods

- `KvCacheSizer.perLayer(gguf, contextSize, cacheTypeK, cacheTypeV)`: one
  full-attention block, `(bytesK x k_dim + bytesV x v_dim) x kv_heads x ctx`.
- `KvCacheSizer.total(gguf, contextSize, cacheTypeK, cacheTypeV, swaFull)`: the
  whole model. Without a window layout (or with `swaFull`) and without a loop
  core it is `perLayer` times the KV block count (hybrid aware); otherwise the
  sum of `atLayer`.
- `KvCacheSizer.atLayer(gguf, i, contextSize, cacheTypeK, cacheTypeV, swaFull)`:
  zero on a recurrent block, `min(ctx, window + 512)` tokens at the SWA dims and
  per-layer KV heads on a windowed layer, else the full-context size; a block
  inside a looped core ([LoopCoreLayout](LoopCoreLayout.md)) counts once per pass.
- `SWA_CACHE_PAD` (512), `DEFAULT_HEAD_DIM` (128), `DEFAULT_HEAD_COUNT` (32).

## Why

Head dims come from `key_length` / `value_length` when present: Qwen3 uses 128
while `embedding / head_count` reads about 213, a 1.7x over-estimate that flipped
fitting models into CPU offload. Fallbacks: `embedding / head_count`, then 128.
GQA `head_count_kv` is honoured; gemma4's per-layer head array averages for the
scalar rate and is read per layer on a windowed model. On Gemma-4-31B at 131k q8
this is the difference between an 83 GB guess and the real ~6 GB.

## Shared caches and windowed layers under --swa-full (2026-11-20)

- `ownKvLayers(gguf)`: how many blocks, counted from the first, keep a cache
  of their own: `blockCount - sharedKvLayers` (the header's
  `<arch>.attention.shared_kv_layers`), or every block when the field is
  absent, negative or would leave none. `atLayer` is 0 for the blocks past
  it, and `total` walks the blocks whenever there is a window layout, a loop
  core or shared layers.
- `--swa-full` widens a windowed layer to the full context and leaves its own
  key and value sizes and heads as they are. It used to be priced at the
  global layers' sizes.

Both come from Gemma 4 E4B (42 blocks, 18 of them sharing; global layers 512
wide, windowed ones 256). Its load log at 32k with q8_0: 272 MiB for 4 global
layers and 680 MiB for 20 windowed ones with `--swa-full`, 21.25 MiB for
those 20 without. The old price was 2,856 MiB for 42 full-width caches; the
total now matches the log exactly.
