# MlxRepoDownload

`core/llm-server/models/MlxRepoDownload.js`

Downloads a whole Hugging Face MLX repo snapshot into one directory.

## Methods

- `MlxRepoDownload.start({ repoId, files, destDir, onEvent, revision?, freeSpace? })`
  returns `{ promise, cancel }`. `files` is `[{ path, size, sha256 }]` and
  `revision` the `{ sha, pinned, ... }` from [HfMlxRepo](HfMlxRepo.md)`.fetchInfo`
  (no revision reads `main`). Each file goes to
  `SafeRepoPath.join(destDir, path)` from `HfHubClient.resolveUrl(repoId, path, sha)`,
  one at a time through [ResumableDownload](../../shared/download/ResumableDownload.md)
  with its listed size and sha256 as the expectations. Before the first file
  the whole snapshot's bytes still to come are checked against the volume
  ([FreeSpaceGuard](../../shared/download/FreeSpaceGuard.md); `freeSpace` is
  the reader seam). `promise` resolves to `{ success: true, destPath: destDir, bytes }`
  or `{ success: false, canceled: true }`, and rejects with code
  `MLX_EMPTY_REPO` when nothing is downloadable, `DOWNLOAD_UNSAFE_PATH` for a
  repo path that would leave `destDir`, `DOWNLOAD_NO_SPACE`, or a transfer error.
- `onEvent(type, payload)`: `'start' { repoId, files, total, destDir, revision }`
  (`revision` null when unknown), `'download' { received, total }` aggregated
  over all files, `'finalize' { destDir, bytes }`.
- `MlxRepoDownload.SKIP_FILE` matches `.gitattributes` and `.gitignore`.

## Why

A GGUF model is one file; an MLX model is a repo snapshot (config, safetensors
shards, tokenizer) that mlx_lm.server loads as a directory. Progress is reported
across the whole set so the UI shows one bar. After each file the running total
advances by what actually landed, which covers already-present files and sizes
the listing got wrong.
