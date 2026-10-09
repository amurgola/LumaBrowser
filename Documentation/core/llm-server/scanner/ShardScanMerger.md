# ShardScanMerger

`core/llm-server/scanner/ShardScanMerger.js`

Re-derives a split model's whole-model tensor facts by merging every shard's
tensor scan.

## Methods

- `ShardScanMerger.merge(model, firstResult, headerCache)` (async) mutates
  `model.gguf`. It runs only for a complete split (2+ shards, the expected count
  present, a parsed header with `blockCount`, a first-shard `tensorScan`). Each
  other shard is read through the [GgufHeaderCache](GgufHeaderCache.md); the
  scans go through `GgufTensorLayout.merge` and `.derive`. On success it sets
  `attnKvPerLayer`, `attnKvLayerCount`, `mtpGrafted`, `tensorLayout` and clears
  `attnScanError`. Otherwise `attnScanError` says why:
  `shard <name> tensor scan unavailable (<error>)`, the derive error (or
  `merged tensor scan incomplete`), or `merged tensor scan covers X of Y weight bytes`.
- `TOLERANCE_FRACTION` (1%), `TOLERANCE_FLOOR_BYTES` (64 MB).

## Why

The first shard covers only its slice of the blocks (unsloth's first shard is
often header-only), so per-file verdicts come back null. Other shards' tensor
sections are cheap to read (no tokenizer). A missing or unreadable shard skips the
merge entirely, because a partial merge would pass for a complete layout with
holes; a layout that misses more weight bytes than the shards' headers could
explain means a scan is not the file on disk.
