# DownloadPublish

`core/shared/download/DownloadPublish.js`

The last step of every download: flush, rename, flush the directory.

## Methods

- `DownloadPublish.publish(partPath, destPath, { fsImpl })` opens the
  `.partial`, `fsync`s it, closes it, renames it to `destPath`, then on POSIX
  opens the destination directory and `fsync`s that too (Windows cannot open a
  directory, so that step is skipped). A directory that cannot be opened or
  synced is ignored; a file that cannot be synced is not renamed. `fsImpl` is a
  test seam with `fs`'s `promises` API.

## Why

The rename used to follow the last write immediately. A crash or power loss
right after it could leave a correctly named file whose tail blocks were never
written, which the scanner would then trust. Flushing the data before the
rename and the directory entry after it is what makes the rename mean
"complete". Used by [ParallelDownload](ParallelDownload.md) and
[SequentialDownload](SequentialDownload.md).
