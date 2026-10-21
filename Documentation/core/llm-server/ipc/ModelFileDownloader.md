# ModelFileDownloader

`core/llm-server/ipc/ModelFileDownloader.js`

The wizard's and Setup's model download.

## Methods

- `new ModelFileDownloader({ llmServerService, slot, mlxInstall, companions?, download?, pin?, freeSpace? })`
  (defaults `new ModelCompanions()`, `ModelDownload.start`, `HfPinnedRepo.pin`,
  the models folder free-space reader).
- `download(args, send)`:
  - `{ mlx, repoId }` goes to [MlxRepoInstall](MlxRepoInstall.md);
  - otherwise [ModelDownloadRequest](ModelDownloadRequest.md) (`A model URL and filename are required.`;
    an unsafe file name throws `DOWNLOAD_UNSAFE_PATH`), the busy refusal, then
    the [slot](LlmDownloadSlot.md) is reserved before the async pin and
    companion lookups;
  - a Hub resolve URL is pinned once ([HfPinnedRepo](../models/HfPinnedRepo.md)
    at the URL's revision): every part is re-pointed at `resolve/<sha>/` and
    carries its listed size and sha256, and the companions
    ([ModelCompanions](ModelCompanions.md)) are looked up at the same sha. A
    gated or private repo ends here with the `HF_ACCESS_DENIED` error, before
    any transfer; a Hub that cannot be asked for another reason leaves the URLs
    as given (`revision.pinned: false` with `fallbackReason`); a URL off the
    Hub is not pinned (`revision: null`);
  - with companions, everything goes to `<modelsDir>/<owner__repo>/`, else flat;
    every local path is built through [SafeRepoPath](../../shared/download/SafeRepoPath.md);
  - sends `start { file, destPath, parts, revision }`, then checks the volume
    once for the whole set (parts plus companions, minus what is already on
    disk; [FreeSpaceGuard](../../shared/download/FreeSpaceGuard.md)), then each
    part (`part { index, count, file }` for a set, one aggregated bar via
    [ShardedProgress](ShardedProgress.md)), then each companion
    (`companion-start { kind, label, file, approxBytes }`; a failure, including
    an unsafe name, is `companion-error { kind, message }` and not fatal), then `done`;
  - a cancel or pause between or during files ends with [ModelTransfer](ModelTransfer.md)'s outcome.
  Resolves `{ success: true, destPath, file, mmproj, mtp }`; any throw sends
  `error { message }` and resolves `{ success: false, error }`. The slot is always released.

## Why

The slot is reserved up front because the pin and companion lookups are async
and a second download must not race in. Pinning happens here, server-side,
rather than trusting the renderer's URLs: a curated catalog row or a cached
search result still says `resolve/main`, and the pull must read one commit for
all its parts. A companion failure keeps a multi-GB download usable (text-only,
or no drafting).
