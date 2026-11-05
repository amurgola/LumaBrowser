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
  `(0, size)`, then at most one tick per `TICK_MS` (250 ms) and always the
  final `(size, size)`); a mismatch deletes the file and chunk map and throws
  `... checksum mismatch ...`. Both failures are `DOWNLOAD_INTEGRITY`
  [DownloadError](DownloadError.md)s with `retryable: false`. A read error
  throws a plain error without deleting. `forLabel` (e.g. `' for unet'`) is
  inserted after `Download verification failed`. Digests compare
  case-insensitively.
- `DownloadVerifier.sha256File(filePath, onTick)` streams a sha256 hex digest in
  `READ_BYTES` (8 MB) reads, calling `onTick(readBytes)` per read (errors in
  `onTick` are ignored).

## Why

Model files used to be renamed into place with no check at all, while runtime
archives were always sha256-checked. Size is free and catches the common
truncation. The digest is checked when the origin publishes one or the listing
promised one. A bad file is removed together with its chunk map so the retry
starts clean instead of resuming onto corruption, and the typed error keeps the
retry loops from treating corruption as a dropped connection. A transient read
error does not throw away a multi-gigabyte download.

The read size and the tick throttle came from the 202 GB Engram shard of
DeepSeek-V4.1-Flash (2026-11-02): with 64 KB reads every chunk sent an IPC
message, three million for one shard, so the renderer never caught up and the
download looked stuck on "Resuming" for the whole hash. A part whose chunk map
is already complete goes straight to this hash on restart, which is why the
restart itself looked like the hang.
