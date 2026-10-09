# ImageModelManifest

`core/image-server/ipc/ImageModelManifest.js`

Reads and writes an installed image model's `manifest.json` (what the models scanner rehydrates a model from) and finds a model's folder without letting an id escape the models directory.

## Methods

- `ImageModelManifest.pathIn(dir)`, `exists(dir)`.
- `read(dir)` parses the manifest (throws the fs or JSON error); `readOrEmpty(dir)` answers `{}` instead.
- `write(dir, manifest)` pretty JSON (2 spaces).
- `writeQuietly(dir, manifest, label = 'manifest')` logs `[image-server] <label> write failed:` instead of throwing.
- `filesBag(files)` keeps only `{ file, loaderFlag? }` per role.
- `modelDir(modelsDir, id)` the folder, or null unless it is an immediate child (`ContainedPath.isImmediateChild`).

## Why

A failed manifest write leaves a model the scanner can still infer, so installs log rather than fail. The containment rule is the legacy `path.relative` check (no `..`, not absolute, no nesting) through the shared helper.
