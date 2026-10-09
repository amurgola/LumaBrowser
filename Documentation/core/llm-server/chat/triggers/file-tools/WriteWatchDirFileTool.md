# WriteWatchDirFileTool

`core/llm-server/chat/triggers/file-tools/WriteWatchDirFileTool.js`

The `write_file_in_watch_dir` tool of a file-trigger run created with `allowWrite`.

## Methods

- `new WriteWatchDirFileTool(dir)`; `definition()` returns the tool entry
  (`mutating: true`) whose handler calls `execute`.
- `execute({ path, content, append? })`: writes (or appends) text inside the
  watch folder, creating sub-folders. Returns
  `{ success: true, path, name, size, appended }` or `{ success: false, error }`:
  `path is required`, `content too large` (over `WRITE_MAX_CHARS`, 1 M
  characters), `path is outside the watch folder`, `path must name a file`
  (the folder itself), or the file-system error message.

## Why

The description warns that writing the triggering file may fire the trigger
again when `change` events are on.
