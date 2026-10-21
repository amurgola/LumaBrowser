# ParallelDownload

`core/shared/download/ParallelDownload.js`

Downloads one large file as concurrent HTTP Range chunks written at their
offsets into a preallocated `.partial`.

## Methods

- `new ParallelDownload(job).execute()` where `job` is built by
  `ResumableDownload` (`url, destPath, partPath, metaPath, controller,
  canceled(), forLabel, onResume, onProgress, onVerify, verify, expectSha,
  total, chunkSize, parallel, headers, sleep`). Resolves `{ bytes: total, resumed }`
  or `{ canceled: true }`; throws `Download interrupted... (resume on retry)`
  (a retryable [DownloadError](DownloadError.md)) after a chunk fails
  `CHUNK_ATTEMPTS` (4) times, the terminal error itself (`HF_ACCESS_DENIED`,
  `DOWNLOAD_NOT_FOUND`) after one try, a `DOWNLOAD_INTEGRITY` error from the
  verifier, or `Download failed...: cannot preallocate` when the sparse file
  cannot be sized.
- Not meant to be called directly; use `ResumableDownload`.

## Flow

1. Load the `ChunkMeta` sidecar, or plan a fresh grid. Without a sidecar, a
   contiguous `.partial` prefix (from the sequential path, or a lost meta)
   marks its whole chunks done; a partial larger than the file is discarded.
2. Report resumed bytes through `onResume`.
3. If nothing is pending: verify, clear meta, publish, final progress.
4. Open and sparse-preallocate the `.partial` to `total`.
5. Run `min(parallel, pending)` workers; each pulls the next pending chunk with
   the job's headers, writes it positionally, and persists the meta after every
   completed chunk. A failed chunk backs off through [DownloadRetry](DownloadRetry.md)
   before its retry; a terminal failure stops every worker.
6. Canceled -> `{ canceled: true }` (completed chunks stay in the meta);
   failure -> throw; otherwise verify (a mismatch deletes the partial and the
   chunk map), clear meta, fsync and rename ([DownloadPublish](DownloadPublish.md)),
   final progress.

## Why

Writes are chained per chunk and the socket is paused when more than 4 MB is
waiting, so a fast connection cannot outrun the disk. A partially fetched chunk
is simply refetched on resume; only whole chunks are recorded. A short read is
an error so a truncated chunk is never marked done. The sha256 of the finished
file is streamed once by the verifier after the workers close the handle; it is
never read back synchronously.
