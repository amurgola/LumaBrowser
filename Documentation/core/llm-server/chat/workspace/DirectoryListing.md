# DirectoryListing

`core/llm-server/chat/workspace/DirectoryListing.js`

One directory level for the Code view's file tree.

## Methods

- `DirectoryListing.list(absDir, relDir)`: `{ success: true, dir: relDir,
  truncated, entries }` or `{ success: false, error }` when the directory
  cannot be read. Each entry is `{ name, path, type: 'dir'|'file', size }` with
  `path` relative to the workspace root and `size` 0 for directories.
- `DirectoryListing.MAX_ENTRIES` (2000); `truncated` is true past it.

## Rules

- A symlink is reported as whatever it points at; a broken one is skipped
  rather than shown as a file that cannot be opened.
- Directories first, then files, each case-insensitively alphabetical, the
  order every file tree already has.
- The cap keeps a listing of a 50k-file directory from wedging the UI.
