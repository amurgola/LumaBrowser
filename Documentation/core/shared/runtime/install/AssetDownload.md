# AssetDownload

`core/shared/runtime/install/AssetDownload.js`

Streams one release asset to disk and returns its sha256.

## Methods

- `AssetDownload.toFile(url, destPath, { userAgent, onProgress, http = axios })`
  resolves the hex sha256. Writes to `PartialFile.pathFor(destPath)` and renames
  on completion. `onProgress(received, total)` per chunk; `total` is the
  content-length or 0. 10 minute timeout, 5 redirects.

## Why

Hashing while streaming gives the manifest its checksum without a second read.
Runtime archives are hundreds of megabytes and fetched once, so this stays a
plain stream rather than the resumable model downloader
([ResumableDownload](../../download/ResumableDownload.md)), which has no
User-Agent option and returns no hash.
