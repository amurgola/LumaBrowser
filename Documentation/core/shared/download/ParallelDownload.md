# ParallelDownload

`core/shared/download/ParallelDownload.js`

Downloads one large file as concurrent HTTP Range chunks written at their
offsets into a preallocated `.partial`.

## Methods

- `new ParallelDownload(job).execute()` where `job` is built by
  `ResumableDownload` (`url, destPath, partPath, metaPath, controller,
  canceled(), forLabel, onResume, onProgress, onVerify, verify, expectSha,
  total, chunkSize, parallel`). Resolves `{ bytes: total, resumed }` or
  `{ canceled: true }`; throws `Download interrupted...` after a chunk fails
  `CHUNK_RETRIES` (3) times, or `Download failed...: cannot preallocate` when
  the sparse file cannot be sized.
- Not meant to be called directly; use `ResumableDownload`.

## Flow

1. Load the `ChunkMeta` sidecar, or plan a fresh grid. Without a sidecar, a
   contiguous `.partial` prefix (from the sequential path, or a lost meta)
   marks its whole chunks done; a partial larger than the file is discarded.
2. Report resumed bytes through `onResume`.
3. If nothing is pending: verify, clear meta, rename, final progress.
4. Open and sparse-preallocate the `.partial` to `total`.
5. Run `min(parallel, pending)` workers; each pulls the next pending chunk,
   writes it positionally, and persists the meta after every completed chunk.
6. Canceled -> `{ canceled: true }` (completed chunks stay in the meta);
   failure -> throw; otherwise verify, clear meta, rename, final progress.

## Why

Writes are chained per chunk and the socket is paused when more than 4 MB is
waiting, so a fast connection cannot outrun the disk. A partially fetched chunk
is simply refetched on resume; only whole chunks are recorded. A short read is
an error so a truncated chunk is never marked done.
