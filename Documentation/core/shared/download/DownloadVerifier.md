# DownloadVerifier

`core/shared/download/DownloadVerifier.js`

Integrity-checks a finished `.partial` before it is renamed into place.

## Methods

- `DownloadVerifier.verifyPartial({ partPath, metaPath, total, sha256, digest, onVerify, forLabel })`
  resolves when the file is good. When `total > 0` and the size differs, the
  file (and the chunk map at `metaPath`, when given) is deleted and it throws
  `... expected N bytes, got M ...`. When `sha256` is given, it compares
  `digest` (a sha256 already computed over the streamed bytes) or, without
  one, hashes the file (reporting `onVerify(read, size)`, starting with
  `(0, size)`); a mismatch deletes the file and chunk map and throws
  `... checksum mismatch ...`. Both failures are `DOWNLOAD_INTEGRITY`
  [DownloadError](DownloadError.md)s with `retryable: false`. A read error
  throws a plain error without deleting. `forLabel` (e.g. `' for unet'`) is
  inserted after `Download verification failed`. Digests compare
  case-insensitively.
- `DownloadVerifier.sha256File(filePath, onTick)` streams a sha256 hex digest,
  calling `onTick(readBytes)` per chunk (errors in `onTick` are ignored).

## Why

Model files used to be renamed into place with no check at all, while runtime
archives were always sha256-checked. Size is free and catches the common
truncation. The digest is checked when the origin publishes one or the listing
promised one. A bad file is removed together with its chunk map so the retry
starts clean instead of resuming onto corruption, and the typed error keeps the
retry loops from treating corruption as a dropped connection. A transient read
error does not throw away a multi-gigabyte download.
