# ResumableDownload

`core/shared/download/ResumableDownload.js`

Entry point for downloading one file resumably: probes the server, then hands
off to `ParallelDownload` or `SequentialDownload`.

## Methods

- `ResumableDownload.download(options)` is shorthand for
  `new ResumableDownload(options).execute()`.
- `new ResumableDownload({ url, destPath, controller, isCanceled, label,
  onResume, onProgress, onVerify, parallel = 8, chunkSize = 32 MB, verify = true,
  headers, expectedSize, expectedSha256, checkFreeSpace = true, freeSpace,
  attempts = 4, sleep })`
  - `controller` (AbortController) and `isCanceled()` are caller-owned.
  - `label` appears in error messages as `... for <label>`.
  - `onResume(haveBytes)`, `onProgress(received, total, { bytesPerSec, etaMs })`
    (throttled to 250 ms; stats measure this session only),
    `onVerify(readBytes, totalBytes)` during checksum hashing.
  - `parallel: 1` forces the sequential path.
  - `headers` extra request headers for the probe, every chunk and the
    sequential stream; defaults to [HubAuth](HubAuth.md)`.headersFor(url)`, so
    a Hub URL carries the token and any other host carries nothing.
  - `expectedSize` / `expectedSha256` what the listing promised (see
    [HfPinnedRepo](../../llm-server/models/HfPinnedRepo.md)). A served size
    that differs, or a served `X-Linked-Etag` digest that differs, is refused
    before any byte lands; the digest is verified on the finished bytes.
  - `checkFreeSpace` / `freeSpace` the [FreeSpaceGuard](FreeSpaceGuard.md)
    and its reader; `attempts` / `sleep` the [DownloadRetry](DownloadRetry.md)
    policy (`sleep` is a test seam).
- `execute()` resolves to one of:
  - `{ bytes, resumed: false, alreadyPresent: true }` when `destPath` exists
    (no network; any stale meta sidecar is removed)
  - `{ bytes, resumed }` on completion
  - `{ canceled: true }` on cancel
  - throws a [DownloadError](DownloadError.md): `HF_ACCESS_DENIED` for a gated
    or private Hub repo, `DOWNLOAD_NOT_FOUND`, `DOWNLOAD_NO_SPACE`,
    `DOWNLOAD_INTEGRITY` (size or sha256 mismatch; the partial and chunk map
    are deleted), `DOWNLOAD_NETWORK` / `DOWNLOAD_HTTP` (`Download request
    failed...` or `Download interrupted... (resume on retry)`).
- `ResumableDownload.DEFAULT_PARALLEL`, `ResumableDownload.DEFAULT_CHUNK_SIZE`.

## Flow

1. Create the destination directory; return early if `destPath` exists.
2. Probe with a 1-byte Range GET (with backoff on 429/503 and network errors;
   auth and 404 surface at once) for size, Range support and a published sha256.
3. Hold the served size and digest to the expected ones.
4. Check free space for the bytes still to come (finished chunks of a resumed
   download are not counted again).
5. Parallel when the server honours Range, the size is known, `parallel > 1`
   and the file is larger than one chunk; otherwise sequential. A server that
   states no size is still held to `expectedSize`.

## Why

Multi-gigabyte weights must survive a dropped connection or app restart, so
bytes land in a sibling `.partial` and are renamed into place only after
verification and an fsync ([DownloadPublish](DownloadPublish.md)). Hugging
Face's CDN throttles per connection, hence parallel Range chunks.

The primitive is deliberately event-vocabulary-agnostic: callers own the
AbortController, cancel flag and event names, and this only invokes callbacks
and returns a plain result. The LLM, MLX and image downloaders keep their own
thin wrappers (single file vs bag of files, `finalize` vs `file-done`, role
tagging). Keeping them separate is what avoids a finalize double-emit; do not
merge them (see the core/shared admission notes).
