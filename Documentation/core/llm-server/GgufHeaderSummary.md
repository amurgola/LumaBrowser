# GgufHeaderSummary

`core/llm-server/GgufHeaderSummary.js`

Decides which GGUF metadata keys to keep and shapes the kept values into the
flat header summary the planner reads.

## Methods

- `GgufHeaderSummary.wants(key)` is true for `general.*` identity keys and
  the arch-prefixed hyper-parameter suffixes in `WANTED_SUFFIX`.
- `GgufHeaderSummary.numberOrNull(value)` coerces to a finite number or null.
- `GgufHeaderSummary.build({ meta, version, tensorCount, kvCount, tensorScan,
  tensorScanError })` returns `{ ok: true, version, tensorCount, kvCount,
  architecture, name, sizeLabel, blockCount, contextLength, embeddingLength,
  feedForwardLength, headCount, headCountKv, headCountKvPerLayer, keyLength,
  valueLength, slidingWindow, slidingWindowPattern, slidingWindowPerLayer,
  keyLengthSwa, valueLengthSwa, attnKvPerLayer, attnKvLayerCount, mtpGrafted,
  attnScanError, tensorLayout, tensorScan, ropeFreqBase, ropeDimensionCount,
  expertCount, expertUsedCount, expertFeedForwardLength, expertSharedCount,
  vocabSize, fileType, fileTypeName, quantizationVersion }`.
- Constants: `WANTED_EXACT`, `WANTED_SUFFIX`, `FTYPE_NAMES`.

## Why these fields

- Keys are suffix-matched because the architecture prefix is unknown until
  `general.architecture` is read; the suffixes are stable across archs.
- `keyLength` / `valueLength`: Qwen3 decouples head dims from
  embedding/head_count (5120/24 is about 213 vs a real 128); without them the
  KV estimate reads 1.7x high and can flip a fitting model to CPU offload.
- `headCountKv` and `slidingWindowPattern` are scalars on most models and
  per-layer arrays on gemma4; both forms are surfaced (`*PerLayer`), the scalar
  being null when the array form is present.
- Sliding-window fields let the planner price windowed layers at the window,
  tens of GB at 128k on a Gemma-class model.
- `expertFeedForwardLength`: many-small-experts archs (deepseek4) write only
  this key. `expertSharedCount`: shared experts stay GPU-resident under
  `--cpu-moe`.
- `general.alignment` is kept to locate the tensor data section.
- `fileTypeName` is a cross-check; unknown values read `ftype N`.
- `attnScanError` is the walk's failure reason, else the coverage error from
  `GgufTensorLayout.derive`, else null, so a degraded scan is diagnosable from
  the header cache.
