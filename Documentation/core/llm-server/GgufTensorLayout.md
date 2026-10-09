# GgufTensorLayout

`core/llm-server/GgufTensorLayout.js`

Turns GGUF tensor-info entries into per-block facts: which blocks keep a
context KV cache, whether an MTP head is grafted in, and tensor bytes by
llama.cpp placement.

## Methods

- `GgufTensorLayout.scan(entries, dataBytes)` takes `[{ name, offset }]` and
  returns a JSON-safe scan `{ blocks, kvBlocks, mtpTensors,
  expertBytesByBlock, residentBytesByBlock, hostBytes, otherBytes, dataBytes,
  tensorCount }`.
- `GgufTensorLayout.merge(scans)` unions blocks and sums bytes across the
  shards of a split model; `null` when the list is empty or any shard is
  missing, so a partial merge never reads as complete.
- `GgufTensorLayout.derive(scan, blockCount)` returns `{ attnKvPerLayer,
  attnKvLayerCount, mtpGrafted, tensorLayout, error }`. Everything except
  `mtpGrafted` is null unless the scan covers every block `0..blockCount-1`;
  `error` then says how many blocks were seen. `tensorLayout` is
  `{ expertBytesPerBlock[], residentBytesPerBlock[], hostBytes, otherBytes,
  totalBytes }`.
- `GgufTensorLayout.isPlausibleTensorCount(n)` (0 to 1,000,000).
- `GgufTensorLayout.dataSectionStart(headerEnd, alignment)` rounds up to
  `general.alignment`, default 32.

## Why

**KV verdict.** Only full-attention blocks carry `attn_k`. On Qwen3.8-27B
this reads 17 KV blocks of 65, the difference between pricing 256k-context KV
at about 66 GB and the real 17 GB. A fused-qkv classic architecture comes back
with no KV blocks; the planner treats an all-or-nothing split as
untrustworthy and keeps every-layer pricing.

**Byte sizes from offsets.** Tensors are laid out back to back, so each size
is the gap to the next offset (the last runs to the end of the data). That is
exact including padding and needs no ggml type table for new quant types.

**Placement classes.** `blk.N.ffn_(gate|up|down)_exps` is exactly what
`--n-cpu-moe` moves to RAM; shared experts and the router stay put.
`token_embd` and `per_layer_token_embd` stay on the CPU regardless of `-ngl`.
On Qwen3.8-Flash-Next that table is 26.8 GB of 104 GB, and pricing it as GPU or
expert bytes starved the expert fill to two thirds of the cards.

**MTP head.** `blk.N.nextn.*` tensors mark a grafted Multi-Token-Prediction
head, the only trustworthy answer to "can `--spec-type draft-mtp` draft from
this file alone"; filenames do not say. A scan with no blocks at all leaves
`mtpGrafted` null ("could not look") rather than false. Blocks past the stack
(the nextn block) are allowed by the coverage check, but their bytes are not
included in the per-block arrays (legacy behaviour, kept).

**Empty vs null.** Zero tensors is a real shape (unsloth puts the tokenizer in
a header-only first shard) and yields an empty, mergeable scan.
