# ExistingModelAdopter

`core/image-server/ipc/ExistingModelAdopter.js`

Adopts checkpoints the user already has in other image tools: scans for them, then links one into its own model folder with an import manifest.

## Methods

- `new ExistingModelAdopter(imageServerService)`.
- `scan({ roots? })` `ExistingImageLibraryScanner.scan({ modelsDir, roots })` with only non-empty string roots (null discovers installs).
- `adopt({ sourcePath, name?, promptStyle? })` resolves `{ id, dir, mode }`. Re-classifies the file (`CheckpointClassifier.classify`) rather than trusting the renderer, builds the entry (name falls back to the file name), and places it under the first free id (`<id>`, `<id>-2` ... `<id>-9`): a folder is reused only when it already holds this very file (`FileLinker.isSameFile`). Writes the import manifest with `linkedFrom` unless a re-run found an existing manifest. Refusals throw: `A source path is required.`, the classifier's reason, `A different model named "<name>" is already installed.`, or the linker's error (the empty folder is removed).

## Why

Someone arriving with 40 GB of SDXL fine-tunes should link them, not copy them; linking into another model's folder would give its scanner row a second diffusion file.
