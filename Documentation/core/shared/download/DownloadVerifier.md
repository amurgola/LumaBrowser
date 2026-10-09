# DownloadVerifier

`core/shared/download/DownloadVerifier.js`

Integrity-checks a finished `.partial` before it is renamed into place.

## Methods

- `DownloadVerifier.verifyPartial({ partPath, total, sha256, onVerify, forLabel })`
  resolves when the file is good. When `total > 0` and the size differs, the
  file is deleted and it throws `... expected N bytes, got M ...`. When
  `sha256` is given, it hashes the file (reporting `onVerify(read, size)`,
  starting with `(0, size)`); a mismatch deletes the file and throws
  `... checksum mismatch ...`. A read error throws without deleting.
  `forLabel` (e.g. `' for unet'`) is inserted after `Download verification failed`.
- `DownloadVerifier.sha256File(filePath, onTick)` streams a sha256 hex digest,
  calling `onTick(readBytes)` per chunk (errors in `onTick` are ignored).

## Why

Model files used to be renamed into place with no check at all, while runtime
archives were always sha256-checked. Size is free and catches the common
truncation. The digest is checked only when the origin publishes one. A bad
file is removed so the retry starts clean instead of resuming onto corruption,
but a transient read error does not throw away a multi-gigabyte download.
