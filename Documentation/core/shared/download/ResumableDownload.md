# ResumableDownload

`core/shared/download/ResumableDownload.js`

Entry point for downloading one file resumably: probes the server, then hands
off to `ParallelDownload` or `SequentialDownload`.

## Methods

- `ResumableDownload.download(options)` is shorthand for
  `new ResumableDownload(options).execute()`.
- `new ResumableDownload({ url, destPath, controller, isCanceled, label,
  onResume, onProgress, onVerify, parallel = 8, chunkSize = 32 MB, verify = true })`
  - `controller` (AbortController) and `isCanceled()` are caller-owned.
  - `label` appears in error messages as `... for <label>`.
  - `onResume(haveBytes)`, `onProgress(received, total, { bytesPerSec, etaMs })`
    (throttled to 250 ms; stats measure this session only),
    `onVerify(readBytes, totalBytes)` during checksum hashing.
  - `parallel: 1` forces the sequential path.
- `execute()` resolves to one of:
  - `{ bytes, resumed: false, alreadyPresent: true }` when `destPath` exists
    (no network; any stale meta sidecar is removed)
  - `{ bytes, resumed }` on completion
  - `{ canceled: true }` on cancel
  - throws `Download request failed[ for label]: ...`, `Download interrupted...
    (resume on retry)`, or a `DownloadVerifier` error.
- `ResumableDownload.DEFAULT_PARALLEL`, `ResumableDownload.DEFAULT_CHUNK_SIZE`.

## Flow

1. Create the destination directory; return early if `destPath` exists.
2. Probe with a 1-byte Range GET for size, Range support and a published sha256.
3. Parallel when the server honours Range, the size is known, `parallel > 1`
   and the file is larger than one chunk; otherwise sequential.

## Why

Multi-gigabyte weights must survive a dropped connection or app restart, so
bytes land in a sibling `.partial` and are renamed into place atomically only
after verification. Hugging Face's CDN throttles per connection, hence parallel
Range chunks.

The primitive is deliberately event-vocabulary-agnostic: callers own the
AbortController, cancel flag and event names, and this only invokes callbacks
and returns a plain result. The LLM, MLX and image downloaders keep their own
thin wrappers (single file vs bag of files, `finalize` vs `file-done`, role
tagging). Keeping them separate is what avoids a finalize double-emit; do not
merge them (see the core/shared admission notes).
