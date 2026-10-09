# ModelFileDownloader

`core/llm-server/ipc/ModelFileDownloader.js`

The wizard's and Setup's model download.

## Methods

- `new ModelFileDownloader({ llmServerService, slot, mlxInstall, companions?, download? })`
  (defaults `new ModelCompanions()`, `ModelDownload.start`).
- `download(args, send)`:
  - `{ mlx, repoId }` goes to [MlxRepoInstall](MlxRepoInstall.md);
  - otherwise [ModelDownloadRequest](ModelDownloadRequest.md) (`A model URL and filename are required.`),
    the busy refusal, then the [slot](LlmDownloadSlot.md) is reserved before the
    async companion lookup ([ModelCompanions](ModelCompanions.md));
  - with companions, everything goes to `<modelsDir>/<owner__repo>/`, else flat;
  - sends `start { file, destPath, parts }`, then each part (`part { index, count, file }`
    for a set, one aggregated bar via [ShardedProgress](ShardedProgress.md)), then each
    companion (`companion-start { kind, label, file, approxBytes }`; a failure is
    `companion-error { kind, message }` and not fatal), then `done`;
  - a cancel or pause between or during files ends with [ModelTransfer](ModelTransfer.md)'s outcome.
  Resolves `{ success: true, destPath, file, mmproj, mtp }`; any throw sends
  `error { message }` and resolves `{ success: false, error }`. The slot is always released.

## Why

The slot is reserved up front because the companion lookup is async and a second
download must not race in. A companion failure keeps a multi-GB download usable
(text-only, or no drafting).
