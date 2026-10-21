# SequentialDownload

`core/shared/download/SequentialDownload.js`

Downloads one file as a single stream into a contiguous `.partial`, resuming
with `Range: bytes=<have>-`.

## Methods

- `new SequentialDownload(job).execute()` with the same `job` shape as
  `ParallelDownload` (it ignores `chunkSize` and `parallel`; `total` is the
  fallback when the server states no size). Resolves `{ bytes, resumed }` or
  `{ canceled: true }`; throws a [DownloadError](DownloadError.md):
  `Download request failed...`, `Download interrupted... (resume on retry)`
  once the retry budget is spent, the terminal access or not-found error, or
  `DOWNLOAD_INTEGRITY`.
- Not meant to be called directly; use `ResumableDownload`.

## Flow

1. If a `ChunkMeta` sidecar exists, the `.partial` is sparse (parallel path),
   so both are deleted.
2. Each attempt (under [DownloadRetry](DownloadRetry.md), `job.attempts`):
   resume offset = current `.partial` size; `onResume(offset)` once when > 0.
3. GET with the job's headers and the Range header. 416 means the partial
   already is the whole file: it is verified (hashed in full) and published.
4. 206 with an offset appends; 200 restarts from zero.
5. When a sha256 is expected, a hash is opened and the resumed prefix is fed
   into it first; every streamed chunk updates it, so the finished file is never
   read a second time.
6. Stream to disk with throttled progress. Abort destroys both streams and
   returns `{ canceled: true }`, keeping the partial for the next attempt. Any
   other stream error lets the file stream drain, then throws a retryable
   interruption, so the next attempt resumes after the bytes that landed.
7. Verify against the header total (else the expected size, else the received
   count) and the streamed digest, send a final progress tick, fsync and rename
   ([DownloadPublish](DownloadPublish.md)).

## Why

Used when the server ignores Range, the size is unknown, or the file is no
bigger than one chunk, where parallel segment setup outweighs the transfer.
There is no total-request timeout: multi-gigabyte transfers legitimately take
long, and stalls end through cancel or stream errors.
