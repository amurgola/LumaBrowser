# KvCacheSizer

`core/llm-server/server/launch/KvCacheSizer.js`

Prices the KV cache of a GGUF model in bytes for a context length and K/V precision.

## Methods

- `KvCacheSizer.perLayer(gguf, contextSize, cacheTypeK, cacheTypeV)`: one
  full-attention block, `(bytesK x k_dim + bytesV x v_dim) x kv_heads x ctx`.
- `KvCacheSizer.total(gguf, contextSize, cacheTypeK, cacheTypeV, swaFull)`: the
  whole model. Without a window layout (or with `swaFull`) it is `perLayer` times
  the KV block count (hybrid aware); otherwise the sum of `atLayer`.
- `KvCacheSizer.atLayer(gguf, i, contextSize, cacheTypeK, cacheTypeV, swaFull)`:
  zero on a recurrent block, `min(ctx, window + 512)` tokens at the SWA dims and
  per-layer KV heads on a windowed layer, else the full-context size.
- `SWA_CACHE_PAD` (512), `DEFAULT_HEAD_DIM` (128), `DEFAULT_HEAD_COUNT` (32).

## Why

Head dims come from `key_length` / `value_length` when present: Qwen3 uses 128
while `embedding / head_count` reads about 213, a 1.7x over-estimate that flipped
fitting models into CPU offload. Fallbacks: `embedding / head_count`, then 128.
GQA `head_count_kv` is honoured; gemma4's per-layer head array averages for the
scalar rate and is read per layer on a windowed model. On Gemma-4-31B at 131k q8
this is the difference between an 83 GB guess and the real ~6 GB.
