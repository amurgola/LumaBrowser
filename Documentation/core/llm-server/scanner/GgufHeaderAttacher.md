# GgufHeaderAttacher

`core/llm-server/scanner/GgufHeaderAttacher.js`

Reads a GGUF model's header into `model.gguf` for the launch planner.

## Methods

- `GgufHeaderAttacher.isTarget(model)` true for `kind: 'weights'` with a first weight path.
- `GgufHeaderAttacher.attach(model, headerCache)` (async) parses the first shard
  through the [GgufHeaderCache](GgufHeaderCache.md) (keyed on its path, size and
  `modifiedAt`; a hit after [GgufRoleResolver](GgufRoleResolver.md) read it).
  On success `model.gguf` is `factsOf(result)`, then
  [ShardScanMerger](ShardScanMerger.md) merges split shards and
  [ModelClassifier](ModelClassifier.md)`.augmentFromGguf` corrects the filename
  guesses. On failure `model.gguf = { parsed: false, error }` (`unknown parse
  error` when there is none).
- `GgufHeaderAttacher.factsOf(result)` `{ parsed: true, ...FIELDS }`.
- `FIELDS` the copied header fields: identity (architecture, name, baseName,
  generalType), role (`role`, `roleSource`, `roleReason`, `poolingType`,
  `projectorType`), `parameterCount` / `parameterCountSource`, `hasChatTemplate` /
  `chatTemplateLength` / `chatTemplateTruncated` (the template text itself stays
  in the header cache and off the scan IPC payload), block count, context,
  attention shape, sliding
  window, per-layer KV, MTP, tensor layout, experts, vocab, file type
  (`fileTypeName`, `fileTypeSource`, `dominantTensorType`), quantization version.

## Why

`blockCount` lets the planner size a real partial offload instead of the old
all-or-nothing `-ngl 0/999`; the attention fields price the KV cache. A failed
read leaves the planner's binary fallback.
