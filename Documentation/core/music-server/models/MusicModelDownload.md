# MusicModelDownload

`core/music-server/models/MusicModelDownload.js`

Downloads a music model's HuggingFace repo snapshot and marks it complete.

## Methods

- `MusicModelDownload.start({ modelId, modelsDir, onEvent, catalog? })` returns
  `{ promise, cancel }`; throws `Unknown music model: <id>` at once for an id
  not in the catalog (`catalog` defaults to `new MusicModelCatalog()`). The
  snapshot goes to `<modelsDir>/<id>`. `promise` resolves to the
  [MlxRepoDownload](../../llm-server/models/MlxRepoDownload.md) result
  (`{ success: true, destPath, bytes }` or `{ success: false, canceled: true }`);
  `onEvent` receives that downloader's events (`start`, `download`, `finalize`).
  `cancel()` works during the repo listing and during the transfer.
- `MusicModelDownload.isInstalled(modelsDir, modelId)` is true exactly when the
  completion marker exists.
- `MusicModelDownload.readMarker(modelsDir, modelId)` returns the marker
  `{ id, hfRepo, bytes, files, completedAt }`, or `null` when missing or corrupt.
- `MusicModelDownload.MARKER` is `luma-model.json`.

## Why

Music models are directory snapshots exactly like MLX models, so the MLX
snapshot downloader is reused rather than mirrored (a candidate for a later
move into `core/shared/download/`). The marker is written only after every file
landed, so the models view can tell a complete 50+ GB snapshot from an
interrupted one without re-hashing it.
