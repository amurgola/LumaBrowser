# HybridAttentionLayout

`core/llm-server/server/launch/HybridAttentionLayout.js`

Reads which blocks of a hybrid linear-attention model keep a context-length KV cache.

## Methods

- `HybridAttentionLayout.of(gguf)` returns `{ kvLayers, totalLayers, hasKvAt(i) }`
  from `gguf.attnKvPerLayer`, or `null` when the array is missing, the wrong
  length, or all-or-nothing.

## Why

The qwen35 class interleaves deltanet blocks (a constant recurrent state, no
per-token KV) with full-attention blocks: 17 of 65 on Qwen3.8-27B. No header key
says so; [GgufTensorLayout](../../GgufTensorLayout.md) reads it from tensor names.
Pricing every block read the 256k f16 KV as ~66 GB against a real ~17 GB, the
difference between full offload and a 5.9 tok/s partial split. All-or-nothing
reads as a classic model (or a fused-qkv architecture the marker cannot see), so
it keeps every-layer pricing.
