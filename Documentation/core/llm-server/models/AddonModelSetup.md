# AddonModelSetup

`core/llm-server/models/AddonModelSetup.js`

One click on an add-on model entry ([ModelCatalogRegistry](ModelCatalogRegistry.md))
runs the chain a user would otherwise do by hand: install the runtime the
model needs if it is missing, download the weights, verify them, and write a
`<filename>.luma.json` sidecar the models scanner reads to type the file.

## Methods

- `new AddonModelSetup({ registry?, download? })`: defaults
  `ModelCatalogRegistry.shared` and [ModelDownload](ModelDownload.md); use one
  instance per setup run.
- `execute(id, { modelsDir, runtimesRoot, detectRuntime, installRuntime, onEvent, isCanceled, handle })`
  resolves `{ destPath, runtimeId, sidecar }`:
  1. `entry.requiresRuntime`: `detectRuntime(id)` must resolve a detector row;
     when it is not installed, `installRuntime(id, { runtimesRoot, isCanceled, onEvent })` runs.
  2. weights download to `destPathFor(entry, modelsDir)`; `handle.cancel` is
     wired to the live transfer while it runs.
  3. when `entry.file.sha256` is set, the file is hashed and compared
     (case-insensitive); a mismatch deletes the file.
  4. the sidecar is written: `{ schema, id, kind, label, requiresRuntime,
     contextLength, defaultContextSize, bytes, sha256, installedAt, ...entry.sidecar }`.
- Events `onEvent(type, payload)`: `start { id }`, `runtime { runtimeId, type,
  payload }` (nested installer events between `start` and `finalize`),
  `model { type, payload }` (nested downloader events), `verify { read, total }`
  (at most every 250 ms, plus the final tick), `sidecar { path }`, `done`.
  A throwing listener never aborts the setup.
- Typed failures (`err.code`): `ADDON_MODEL_UNKNOWN`, `RUNTIME_UNAVAILABLE`
  (no detector row), `RUNTIME_NOT_INSTALLED` (no `installRuntime`),
  `CHECKSUM_MISMATCH`, `CANCELED` ("Setup canceled.", after the runtime step
  or when the download was canceled or paused). A missing `modelsDir` throws.
- Statics:
  - `destPathFor(entry, modelsDir)`: `<modelsDir>/<entry.dir || entry.id>/<file.filename>`,
    with slashes in the folder name turned into `_`.
  - `sidecarPathFor(weightsPath)`: `weightsPath + '.luma.json'`.
  - `readSidecar(weightsPath)`: the parsed sidecar, or `null` when absent,
    corrupt or of another schema.
  - `isInstalled(entry, modelsDir)`: the weights file exists and its sidecar reads.
  - `sha256File(path, { onTick, isCanceled })`: hex digest; rejects
    `canceled` when `isCanceled()` turns true mid-read.
  - `SIDECAR_SUFFIX`, `SIDECAR_SCHEMA` (`'luma-addon-model'`).

## Why

The scanner is the only consumer of the sidecar, so the file layout is the
contract: a model is installed when its weights are at the expected path and
the sidecar next to them parses.

The downloader already checks a digest the origin advertises; the extra pass
pins the file to the digest the extension vouches for, which is the one that
matters for a file the runtime will map into a GPU. It keeps its own hasher
rather than `DownloadVerifier.sha256File` because that one cannot be
canceled and would emit a progress event per 64 KB of a multi-gigabyte file.
