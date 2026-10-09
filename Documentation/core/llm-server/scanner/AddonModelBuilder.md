# AddonModelBuilder

`core/llm-server/scanner/AddonModelBuilder.js`

Rolls add-on single-file models (for example `.ninfer`) into model entries.

## Methods

- `AddonModelBuilder.build(files, rootDir, readSidecar = AddonModelSetup.readSidecar)`:
  one entry per file. `kind` and `name` come from the sidecar (`kind`, `label`),
  else the file's default kind and its name without the last extension; `gguf: null`;
  `addon: { id, requiresRuntime, contextLength, defaultContextSize, quant, modelId, hasSidecar }`
  (nulls without a sidecar; numbers via `Number(...) || null`).

## Why

The `.luma.json` sidecar written by [AddonModelSetup](../models/AddonModelSetup.md)
is the contract that types the file. `modelId` is the server's public model id
(NInfer validates request `model` against it; the extension planner pins it with
`--model-id`).
