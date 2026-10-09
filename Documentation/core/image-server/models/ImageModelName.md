# ImageModelName

`core/image-server/models/ImageModelName.js`

Display names for local image models: a user override, then the curated catalog
label, then a prettified name. The image twin of the LLM server's
[ModelName](../../llm-server/models/ModelName.md).

## Methods

- `ImageModelName.key(filePath)` is the base name (either slash style) without
  a `.gguf`, `.safetensors`, `.ckpt`, `.bin`, `.pth` or `.pt` extension; empty
  input gives `''`.
- `ImageModelName.resolveDisplayName({ stem, overrides }, catalog?)` returns, in
  order: `''` for an empty stem, the trimmed `overrides[stem]`, the label of the
  catalog row whose id is `stem` or whose diffusion file's key is `stem`, else
  `prettify(stem)`. `catalog` defaults to a new
  [ImageModelCatalog](ImageModelCatalog.md) (shipped plus extension rows).
- `ImageModelName.prettify(stem)` turns runs of `.`, `_`, `-` into single spaces.
- `ImageModelName.WEIGHT_EXTENSION` is the extension pattern.

## Why

Image stems are directory names (`z-image-turbo`), not quant-laden GGUF file
names, so the LLM side's token styling would mangle them; a plain separator
swap is enough. Matching on the diffusion file key lets a manifest-free folder
named after its weights still pick up the curated label.
