# GgufHeaderAttacher

`core/llm-server/scanner/GgufHeaderAttacher.js`

Reads a GGUF model's header into `model.gguf` for the launch planner.

## Methods

- `GgufHeaderAttacher.isTarget(model)` true for `kind: 'weights'` with a first weight path.
- `GgufHeaderAttacher.attach(model, headerCache)` (async) parses the first shard
  through the [GgufHeaderCache](GgufHeaderCache.md). On success `model.gguf` is
  `factsOf(result)`, then [ShardScanMerger](ShardScanMerger.md) merges split
  shards and [ModelClassifier](ModelClassifier.md)`.augmentFromGguf` corrects the
  filename guesses. On failure `model.gguf = { parsed: false, error }`
  (`unknown parse error` when there is none).
- `GgufHeaderAttacher.factsOf(result)` `{ parsed: true, ...FIELDS }`.
- `FIELDS` the 30 copied header fields (architecture, block count, context,
  attention shape, sliding window, per-layer KV, MTP, tensor layout, experts,
  vocab, file type, ...).

## Why

`blockCount` lets the planner size a real partial offload instead of the old
all-or-nothing `-ngl 0/999`; the attention fields price the KV cache. A failed
read leaves the planner's binary fallback.
