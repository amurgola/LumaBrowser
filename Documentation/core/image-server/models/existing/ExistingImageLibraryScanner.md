# ExistingImageLibraryScanner

`core/image-server/models/existing/ExistingImageLibraryScanner.js`

Lists the image checkpoints the user already has in other image tools (ComfyUI,
Fooocus, Stable Diffusion WebUI, Forge, SD.Next, SwarmUI, Stability Matrix):
compatible ones to link without copying, the rest skipped with a reason. The
image twin of the LLM existing-library scan; pure filesystem work.

## Methods

- `ExistingImageLibraryScanner.scan({ modelsDir?, roots?, env? })` returns
  `{ models, skipped, sources, installs }`:
  - `models`: compatible records, largest first: `{ id, source, sourceLabel,
    installDir, name, file, path, realPath, bytes, archLabel, baseType,
    promptStyle?, guessed?, adopted }`.
  - `skipped`: the same base record plus `reason`, largest first.
  - `sources`: count of models per tool.
  - `installs`: `[{ tool, label, dir }]`.

  `roots` replaces discovery; `env` defaults to `process.env`.
- `execute(installs)` is the instance step behind `scan`.
- Statics: `MAX_DEPTH` (3), `MIN_MODEL_BYTES` (64 MB), `WEIGHT_RE`.

## Rules

- Checkpoint folders are walked up to 3 levels deep (users sort into `SDXL/`,
  `anime/`), following symlinked folders (`statSync`, not the dirent), keeping
  `.safetensors` / `.ckpt` / `.gguf` files of at least 64 MB (smaller files are
  configs or embeddings).
- Files are deduped by real path: Stability Matrix symlinks one shared library
  into every package.
- Anything inside `modelsDir` (the app's own image library) is skipped; a found
  file already linked into it (same real path, or same device and inode) is
  `adopted: true`.
- Architecture comes from [CheckpointClassifier](CheckpointClassifier.md);
  installs from [ImageToolInstallFinder](ImageToolInstallFinder.md).
