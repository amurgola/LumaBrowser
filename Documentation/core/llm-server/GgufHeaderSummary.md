# GgufHeaderSummary

`core/llm-server/GgufHeaderSummary.js`

Decides which GGUF metadata keys to keep and shapes the kept values into the
flat header summary the planner reads.

## Methods

- `GgufHeaderSummary.wants(key)` is true for `general.*` identity keys
  (including `general.type` and `general.parameter_count`),
  `tokenizer.chat_template`, the arch-prefixed hyper-parameter suffixes in
  `WANTED_SUFFIX` (including `pooling_type`) and the `clip.*` keys in
  `WANTED_CLIP`. `CLIP_KEY` matches any `clip.*` key (presence only).
- `GgufHeaderSummary.numberOrNull(value)` coerces to a finite number or null.
- `GgufHeaderSummary.build({ meta, version, tensorCount, kvCount, tensorScan,
  tensorScanError, hasClipKeys })` returns `{ ok: true, version, tensorCount,
  kvCount, architecture, name, baseName, sizeLabel, generalType, role,
  roleSource, roleReason, poolingType, projectorType, parameterCount,
  parameterCountSource, chatTemplate, hasChatTemplate, chatTemplateLength,
  chatTemplateTruncated, blockCount,
  contextLength, embeddingLength, feedForwardLength, headCount, headCountKv,
  headCountKvPerLayer, keyLength, valueLength, slidingWindow,
  slidingWindowPattern, slidingWindowPerLayer, keyLengthSwa, valueLengthSwa,
  attnKvPerLayer, attnKvLayerCount, mtpGrafted, attnScanError, tensorLayout,
  tensorScan, ropeFreqBase, ropeDimensionCount, expertCount, expertUsedCount,
  expertFeedForwardLength, expertSharedCount, vocabSize, fileType,
  fileTypeName, fileTypeSource, dominantTensorType, quantizationVersion }`.
- Constants: `WANTED_EXACT`, `WANTED_SUFFIX`, `WANTED_CLIP`, `CLIP_KEY`,
  `CHAT_TEMPLATE_MAX_CHARS` (32 K), `FTYPE_NAMES`, `GGML_TYPE_NAMES`.

## Role, parameter count, chat template, quant label

- `role` / `roleSource: 'header'` / `roleReason` come from
  [GgufRoleTable](GgufRoleTable.md)`.headerRole`; `role` is null (and
  `roleSource` null) when the header names no architecture or type, which is
  the scanner's cue to fall back to the file name.
- `parameterCount` is `general.parameter_count` when present
  (`parameterCountSource: 'header'`), else the element total of the tensor walk
  (`'tensors'`, partial for a shard until `ShardScanMerger` sums the split).
- `chatTemplate` is `tokenizer.chat_template` cut at `CHAT_TEMPLATE_MAX_CHARS`
  with `chatTemplateTruncated` set when it was; `chatTemplateLength` is the
  length as written and `hasChatTemplate` its presence. Only those two scalars
  are copied onto `model.gguf` (see `GgufHeaderAttacher.FIELDS`); the text
  stays in the header cache so the scan IPC payload does not carry it.
- `fileTypeName` is the `FTYPE_NAMES` entry for `general.file_type`
  (`fileTypeSource: 'header'`); failing that the ggml type holding the most
  tensor bytes (`'tensors'`, also exposed as `dominantTensorType`); failing that
  `ftype N`. `FTYPE_NAMES` includes `MXFP4_MOE` (38); `GGML_TYPE_NAMES` includes
  `MXFP4` (39) and the ternary types.

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
