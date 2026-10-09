# PartialFile

`core/shared/download/PartialFile.js`

Naming and sizing of the `.partial` file a download writes into before its
atomic rename.

## Methods

- `PartialFile.pathFor(destPath)` returns `destPath + '.partial'`.
- `PartialFile.size(filePath)` returns the file size in bytes, or 0 when it is missing.
- `PartialFile.SUFFIX` is `'.partial'`.

## Why

Every downloader (and the caller wrappers that report resume progress) must
agree on where unfinished bytes live; one class owns that convention.
