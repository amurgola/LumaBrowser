# TarballDownloader

`core/tts-server/runtimes/TarballDownloader.js`

Streams a file to disk through a sibling `.partial` and renames it only once the
whole body arrived, and unpacks npm-style `.tgz` tarballs.

## Methods

- `TarballDownloader.download(url, destPath, onProgress?)` GETs `url` as a
  stream (10 min timeout, up to 5 redirects, `User-Agent: LumaBrowser-VoiceSetup`),
  writes `<destPath>.partial`, reports `onProgress(received, total)` per chunk,
  then renames to `destPath`. When `Content-Length` is known and the byte count
  differs it rejects with `code: 'DOWNLOAD_INCOMPLETE'` and
  `detail: { url, received, total }`. On any failure the `.partial` is removed
  and `destPath` is never created. A throwing progress listener is ignored.
- `TarballDownloader.extract(archivePath, destDir)` runs
  `tar -xzf <archive> --strip-components 1 -C <destDir>` (5 min timeout);
  rejects with `extract failed: <stderr>`.
- Statics: `DOWNLOAD_TIMEOUT_MS`, `EXTRACT_TIMEOUT_MS`, `USER_AGENT`, `PARTIAL_SUFFIX`.

## Why

Before the `.partial` step a connection dropped mid-transfer left a truncated
`.tgz`, tar refused it, and the user was told extraction failed when the
download did (legacy bug L7). A premature close that never surfaces as a stream
error looks like success at the stream level, hence the explicit length check.
The write handle is closed before unlinking, or an in-flight write would recreate
the file. npm tarballs root everything under `package/`, hence the strip.

Also used for the Pocket voice clips (`TtsServerService` downloads them through
it). Reuse candidate for `core/shared/download`, which already owns the
`.partial` naming (`PartialFile`).
