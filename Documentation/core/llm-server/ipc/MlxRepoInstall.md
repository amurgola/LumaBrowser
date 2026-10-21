# MlxRepoInstall

`core/llm-server/ipc/MlxRepoInstall.js`

Downloads an MLX model (a whole repo snapshot) into a managed `owner__repo` folder.

## Methods

- `new MlxRepoInstall({ slot, mlx?, download? })` (defaults `HfMlxRepo`, `MlxRepoDownload.start`).
- `install(repoId, modelsDir, send)` refuses when the [slot](LlmDownloadSlot.md) is
  busy, fetches the repo info (pinned to one commit, with each file's size and sha256),
  sends `start { repoId, destDir }`, downloads holding the slot (the info's `revision`
  and `files` go to [MlxRepoDownload](../models/MlxRepoDownload.md)), then sends
  `done { destPath, file }` and resolves `{ success: true, destPath, file }`,
  or sends `canceled` and resolves `{ success: false, canceled: true }`.
