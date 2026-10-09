# MlxRepoDownload

`core/llm-server/models/MlxRepoDownload.js`

Downloads a whole Hugging Face MLX repo snapshot into one directory.

## Methods

- `MlxRepoDownload.start({ repoId, files, destDir, onEvent })` returns
  `{ promise, cancel }`. `files` is `[{ path, size }]` from
  [HfMlxRepo](HfMlxRepo.md)`.fetchInfo`. Each file goes to
  `<destDir>/<repo path>` from `HfHubClient.resolveUrl(repoId, path)`, one at a
  time through [ResumableDownload](../../shared/download/ResumableDownload.md).
  `promise` resolves to `{ success: true, destPath: destDir, bytes }` or
  `{ success: false, canceled: true }`, and rejects with code `MLX_EMPTY_REPO`
  when nothing is downloadable.
- `onEvent(type, payload)`: `'start' { repoId, files, total, destDir }`,
  `'download' { received, total }` aggregated over all files, `'finalize'
  { destDir, bytes }`.
- `MlxRepoDownload.SKIP_FILE` matches `.gitattributes` and `.gitignore`.

## Why

A GGUF model is one file; an MLX model is a repo snapshot (config, safetensors
shards, tokenizer) that mlx_lm.server loads as a directory. Progress is reported
across the whole set so the UI shows one bar. After each file the running total
advances by what actually landed, which covers already-present files and sizes
the listing got wrong.
