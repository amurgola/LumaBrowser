# FreeSpaceGuard

`core/shared/download/FreeSpaceGuard.js`

Refuses a download before any byte lands when the destination volume cannot
hold it.

## Methods

- `FreeSpaceGuard.assert(destDir, needBytes, { freeSpace, forLabel })` resolves
  `{ freeBytes, needBytes, checked }` when there is room, or when `needBytes`
  is 0 or the volume cannot be read (`checked: false`); throws
  `DOWNLOAD_NO_SPACE` ([DownloadError](DownloadError.md)) when
  `freeBytes < needBytes + FLOOR_BYTES`. The message names the folder, the
  need, the headroom and what is free.
- `FreeSpaceGuard.FLOOR_BYTES` 512 MB of headroom kept beyond the download.
- `FreeSpaceGuard.defaultReader()` the shared volume reader,
  [VolumeFreeSpace](VolumeFreeSpace.md)`.read`. `freeSpace(dir) -> { freeBytes }`
  is the seam.
- `FreeSpaceGuard.format(bytes)` `KB` / `MB` / `GB` for messages.

## Where it runs

- [ResumableDownload](ResumableDownload.md) per file, after the probe and
  before the `.partial` is created, for the bytes still to come (finished chunks
  of a resumed download are not counted again).
- [ModelFileDownloader](../../llm-server/ipc/ModelFileDownloader.md) and
  [MlxRepoDownload](../../llm-server/models/MlxRepoDownload.md) once for the
  whole set (parts plus companions, or the whole snapshot), so a sharded pull
  fails before part 1 rather than at part 7.

## Why

A multi-gigabyte download that runs out of disk half way leaves a torn partial
and a confusing I/O error. An unreadable volume is let through on purpose: the
guard exists to stop a sure failure, not to block an unknown one.
