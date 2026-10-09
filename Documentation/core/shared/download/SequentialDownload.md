# SequentialDownload

`core/shared/download/SequentialDownload.js`

Downloads one file as a single stream into a contiguous `.partial`, resuming
with `Range: bytes=<have>-`.

## Methods

- `new SequentialDownload(job).execute()` with the same `job` shape as
  `ParallelDownload` (it ignores `total`, `chunkSize` and `parallel`). Resolves
  `{ bytes, resumed }` or `{ canceled: true }`; throws
  `Download request failed...` or `Download interrupted... (resume on retry)`.
- Not meant to be called directly; use `ResumableDownload`.

## Flow

1. If a `ChunkMeta` sidecar exists, the `.partial` is sparse (parallel path),
   so both are deleted.
2. Resume offset = current `.partial` size; `onResume(offset)` when > 0.
3. GET with the Range header. 416 means the partial already is the whole file:
   rename and return `{ bytes, resumed: true }` (no verification is possible
   without fresh headers).
4. 206 with an offset appends; 200 restarts from zero.
5. Stream to disk with throttled progress. Abort destroys both streams and
   returns `{ canceled: true }`, keeping the partial for the next attempt.
6. Verify (when enabled) against the header total or the received count,
   send a final progress tick, rename into place.

## Why

Used when the server ignores Range, the size is unknown, or the file is no
bigger than one chunk, where parallel segment setup outweighs the transfer.
There is no total-request timeout: multi-gigabyte transfers legitimately take
long, and stalls end through cancel or stream errors.
