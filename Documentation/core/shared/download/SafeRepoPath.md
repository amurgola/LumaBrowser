# SafeRepoPath

`core/shared/download/SafeRepoPath.js`

The one place a remote file name is allowed to become a local path.

## Methods

- `SafeRepoPath.check(remotePath)` returns the cleaned relative path (forward
  slashes, empty and `.` segments dropped) or throws `DOWNLOAD_UNSAFE_PATH`
  ([DownloadError](DownloadError.md)) when the path is empty, contains a NUL
  byte, is absolute (`/x`, `\x`, `C:...`, UNC), has a `..` segment or a drive
  letter segment.
- `SafeRepoPath.fileName(name)` `check` plus: no folder at all.
- `SafeRepoPath.join(destDir, remotePath)` the absolute local path, proven after
  `path.resolve` to sit inside `destDir` (and not to be `destDir` itself).
- `SafeRepoPath.isSafe(remotePath)` the boolean form of `check`.

## Who uses it

- [HfPinnedRepo](../../llm-server/models/HfPinnedRepo.md) drops unsafe tree
  entries, so [HfMlxRepo](../../llm-server/models/HfMlxRepo.md),
  [HfGgufRepo](../../llm-server/models/HfGgufRepo.md) and
  [HfRepoSiblings](../../image-server/ipc/HfRepoSiblings.md) never list them.
- [MlxRepoDownload](../../llm-server/models/MlxRepoDownload.md) joins every
  snapshot file through it.
- [ModelDownloadRequest](../../llm-server/ipc/ModelDownloadRequest.md) requires
  bare file names from the renderer; [ModelFileDownloader](../../llm-server/ipc/ModelFileDownloader.md)
  joins parts and companions through it.

## Why

A tree entry, a sibling `rfilename` or a part name from the renderer used to
go straight into `path.join(destDir, name)`. One helper with one rule set
replaces the scattered trust.
