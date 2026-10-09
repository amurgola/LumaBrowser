# RouterModelDownloader

`core/llm-server/router/RouterModelDownloader.js`

Downloads the router model from the lumabyte.com model manifest, resumable,
and verifies its SHA-256 before it becomes visible.

## Methods

- `new RouterModelDownloader({ modelFile, http?, startDownload? })`; `http`
  defaults to axios, `startDownload` to [ModelDownload](../models/ModelDownload.md)`.start`.
- `download({ destPath, indexUrl = MODELS_INDEX_URL })` never rejects; resolves
  `{ ok: true }`, `{ ok: false, error: null }` when canceled or paused, or
  `{ ok: false, error }`:
  1. GET the manifest (15 s); the entry named `modelFile` must have `url` and
     `sha256`, else `<file> is not listed in the model manifest.`;
  2. create the directory and download to `<destPath>.download`;
  3. an unsuccessful result is `Router model download failed.`;
  4. a digest mismatch deletes the staged file: `Router model download failed its SHA-256 check.`;
  5. rename into place and log whether it resumed.
- `progress()` `{ received, total }` while transferring (total from the
  manifest `size` until the server reports one), else null.
- `isActive()`, `cancel()`.
- `MODELS_INDEX_URL` `https://lumabyte.com/install/models/index.json`,
  `MANIFEST_TIMEOUT_MS` 15000.
