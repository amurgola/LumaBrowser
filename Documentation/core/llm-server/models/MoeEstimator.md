# MoeEstimator

`core/llm-server/models/MoeEstimator.js`

Splits a MoE GGUF's bytes into routed-expert tensors, GPU-resident tensors and
CPU-side input embeddings, to budget a `--cpu-moe` launch.

## Methods

- `MoeEstimator.estimateSplit(gguf, totalBytes)` takes a parsed header (see
  `GgufParser`) and the on-disk weight bytes. Returns `{ expertFraction,
  expertBytes, residentBytes, hostBytes, expertBytesPerBlock, exact }`, or
  null when the model is not MoE (`expertCount <= 1`), bytes are 0, or the
  header lacks the needed dims.
- Constants: `RESIDENT_SAFETY` (1.15), `RESIDENT_FLOOR_FRACTION` (0.1).

## Exact path

When `gguf.tensorLayout` covers every block, the split is read off real bytes:
expert bytes per block, CPU-side input embeddings (`hostBytes`, capped so
resident never goes negative), and everything else as resident.
`exact: true`. If the layout length mismatches the block count, or expert
bytes are 0 or not below the file size, it falls back to the ratio.

## Ratio path

Parameter counts from header shapes (experts x 3 x d_model x d_ff per block,
GQA-aware attention, shared experts, embeddings, norms). The ratio is
quant-agnostic, so applying it to the real file size estimates the split.
The resident share is inflated by 15% and floored at 10% of the file, because
shared experts, dense layers or a dense d_ff reported in place of the expert
d_ff all make the true resident share larger. A wrong guess then picks a
smaller context instead of OOMing. `hostBytes` is 0 and
`expertBytesPerBlock` null (callers spread evenly), `exact: false`.

The ratio path cannot see host-side embeddings: on Qwen3.8-Flash-Next it
priced a 27 GB `per_layer_token_embd` table as experts, reading per-layer
expert bytes 30% high, which is why the exact path exists.
