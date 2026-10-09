# ImageModelDownload

`core/image-server/models/ImageModelDownload.js`

Downloads an image model's bag of files (diffusion, vae, llm, ...) in order,
each resumable through [ResumableDownload](../../shared/download/ResumableDownload.md),
and reports progress in the image server's multi-file event vocabulary.

## Methods

- `ImageModelDownload.create({ files, dir, onEvent })` returns
  `{ promise, cancel }`. `files` is `[{ role, url, destPath }]` (throws
  `ImageModelDownload: files[] is required` when empty or missing); `dir` is
  informational; `onEvent(type, payload)` is optional.
- The promise resolves `{ success: true, dir, files: [{ role, destPath, bytes }] }`
  or `{ success: false, canceled: true, completed }`, and rejects with the
  ResumableDownload error of a failing file.

Events: `file-start { role, file, destPath, index, total }`,
`resume { role, have }`, `download { role, received, total, bytesPerSec, etaMs }`
(throttled by ResumableDownload), `verify { role, read, total }`,
`file-done { role, destPath, bytes }`, `finalize { dir, files }`.

## Why

Each file resumes independently. A cancel halts the active file and leaves
earlier completed files in place, so a retry only fetches what is missing. The
role is the error label, so a failure says which file broke. This wrapper stays
separate from the LLM and MLX downloaders on purpose (single file vs bag,
`finalize` vs `file-done`); merging them is what once caused a finalize double-emit.
