# TarBz2Archive

`core/tts-server/runtimes/TarBz2Archive.js`

Unpacks a sherpa-onnx model archive (`.tar.bz2` with one top-level folder).

## Methods

- `TarBz2Archive.extract(archivePath, destDir)` runs
  `tar -xjf <archive> --strip-components 1 -C <destDir>` with a 10 minute
  timeout; rejects with `extract failed: <stderr or error message>`.
- `TarBz2Archive.EXTRACT_TIMEOUT_MS`.

## Why

The sherpa archives root everything under a folder named after the model; the
strip lets the caller choose the folder name (the catalog id). The system `tar`
handles bzip2 on Windows 10+, Linux and macOS, so no npm dependency is needed.
`TarballDownloader.extract` is the gzip twin for npm tarballs.
