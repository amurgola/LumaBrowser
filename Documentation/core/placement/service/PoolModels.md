# PoolModels

`core/placement/service/PoolModels.js`

The models that would multiplex through a hotswap card: sizes for the RAM gate,
files for the prewarm.

## Methods

- `new PoolModels({ servers, imageScanner, musicCatalog, statSize? })`;
  `imageScanner.scan(dir)` resolves `{ models }`; `statSize(path)` defaults to
  `fs.statSync(path).size` or 0.
- `async sizes()` -> `{ llm, imageGenerate, imageEdit, imageVideo, music, grounding, _estimated }`:
  - `llm` the model file size; `grounding` `modelFileBytes()`;
  - image models: the sum of the scanned files' bytes, else the model's
    `minVramBytes`; unscanned falls back to 8, 12 and 16 GB (generate, edit,
    video) and sets `_estimated`. Edit and video are 0 when unselected;
  - `music` only when enabled and selected: the row's `approxTotalBytes`, else
    54 GB with `_estimated`;
  - a failing image or music read sets `_estimated`.
- `async files()` the LLM file, every file of the selected image models, the
  files directly inside `<music models dir>/<modelId>` (enabled and selected
  only) and `grounding.modelFiles()`. Failures add nothing.
- `PoolModels.FALLBACK_BYTES`.

## Why

The gate only needs the order of magnitude (disable on 32 GB, enable on 192 GB).
Folding a tens-of-GB music snapshot in unconditionally would fail the gate for
users who never turned music on.
