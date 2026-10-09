# GroundingModelFiles

`core/grounding-server/GroundingModelFiles.js`

File facts for a grounding model.

## Methods

- `GroundingModelFiles.pairMmproj(modelPath)` the projector next to the
  weights: files in the same folder whose name contains `mmproj` and ends in
  `.gguf` (not `.partial`), full precision before any `q<digit>` quantized one.
  Null when none or the folder is unreadable.
- `GroundingModelFiles.sizeOf(path)` bytes, 0 when missing.
- `GroundingModelFiles.exists(path)` false for an empty path.
- `GroundingModelFiles.modelName(modelPath)` the file name without extension.

## Why

Grounding is sensitive to vision-encoder precision and the projector is small
either way, so an f16/bf16 projector wins.
