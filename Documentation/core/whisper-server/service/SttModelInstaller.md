# SttModelInstaller

`core/whisper-server/service/SttModelInstaller.js`

Installs one curated speech-to-text model, one download at a time.

## Methods

- `new SttModelInstaller({ whisperModelsDir, sherpaModelsDir, catalog?, startDownload?, extract? })`;
  the dirs are functions read live; defaults are a new
  [SttModelCatalog](../models/SttModelCatalog.md),
  [ModelDownload](../../llm-server/models/ModelDownload.md)`.start` and
  [TarBz2Archive](../../tts-server/runtimes/TarBz2Archive.md)`.extract`.
- `install(catalogId, onEvent)`:
  - whisper entries download `entry.file` into the whisper dir and resolve the
    ModelDownload result (`destPath` on success);
  - sherpa entries download `entry.archive` into the sherpa dir; a successful
    download wipes `<dir>/<id>`, emits `extract { phase: 'start' }`, extracts,
    emits `extract { phase: 'done' }`, deletes the archive and resolves
    `{ success: true, modelId, destPath, dir }` (both the extracted dir). An
    unsuccessful download result is returned as is.
  - Throws `A voice model download is already in progress.` or
    `Unknown STT model: <id>`.
- `cancel()` cancels the active download; true when one was running.

## Why

The busy flag is claimed before the first await, so a double click cannot start
two downloads of one file. The destination is wiped before extraction so a
re-download never mixes two releases' files. It mirrors
[TtsModelInstaller](../../tts-server/TtsModelInstaller.md) but also handles
single-file whisper models and returns `destPath`, which the service stores as
the default model.
