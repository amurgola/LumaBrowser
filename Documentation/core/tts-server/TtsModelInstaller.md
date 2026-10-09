# TtsModelInstaller

`core/tts-server/TtsModelInstaller.js`

Installs one curated text-to-speech voice model from the catalog.

## Methods

- `new TtsModelInstaller({ catalog, modelsDir })`: `catalog` is a
  `TtsModelCatalog`; `modelsDir()` returns the folder, read live.
- `install(catalogId, onEvent)`:
  1. downloads `<modelsDir>/<archive>` with `ModelDownload.start` (its events go
     to `onEvent`); a result without `success` is returned as-is;
  2. emits `extract { phase: 'start' }`, wipes and recreates `<modelsDir>/<id>/`,
     extracts with `TarBz2Archive.extract`, emits `extract { phase: 'done' }`,
     deletes the archive;
  3. for entries with `voices` (Pocket TTS) downloads each clip missing from
     `<id>/voices/` with `TarballDownloader.download`, emitting
     `download { pkg: 'voice <name>', received, total }`;
  4. resolves `{ success: true, modelId, dir }`.
  Throws `A voice download is already in progress.` or `Unknown TTS model: <id>`.
- `cancel()` cancels the running download; returns whether there was one.

## Why

Clip downloads are best-effort per clip (a warning is logged): one unreachable
file must not fail the install, and the scanner falls back to the archive's
`test_wavs/` when `voices/` is empty. The busy flag is claimed before the first
`await`; legacy checked only the download handle, which was set after the
directory creation, so a quick second click could start a parallel download.
