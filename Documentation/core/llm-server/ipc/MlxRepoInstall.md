# MlxRepoInstall

`core/llm-server/ipc/MlxRepoInstall.js`

Downloads an MLX model (a whole repo snapshot) into a managed `owner__repo` folder.

## Methods

- `new MlxRepoInstall({ slot, mlx?, download? })` (defaults `HfMlxRepo`, `MlxRepoDownload.start`).
- `install(repoId, modelsDir, send)` refuses when the [slot](LlmDownloadSlot.md) is
  busy, fetches the repo info, sends `start { repoId, destDir }`, downloads holding the
  slot, then sends `done { destPath, file }` and resolves `{ success: true, destPath, file }`,
  or sends `canceled` and resolves `{ success: false, canceled: true }`.
