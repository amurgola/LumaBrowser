# WorkspaceFiles

`core/llm-server/chat/WorkspaceFiles.js`

The file surface behind the chat tab's Code view. A conversation in a mode that
works on disk (Code mode's project folder, Game mode's game folder) has exactly
one root directory; this class resolves it and exposes a small, root-jailed
CRUD API so the renderer's Monaco editor can browse, open, edit and save files
without any fs access of its own.

## Methods

- `new WorkspaceFiles({ chatRouter, modeRegistry = ChatModeRegistry.shared })`;
  `chatRouter` needs `chatStore.getMeta(conversationId)`.
- `resolveRoot(conversationId)`: `{ root, label, mode }` or `null`
  ([WorkspaceRootResolver](workspace/WorkspaceRootResolver.md)).
- `info(conversationId)`: `{ success: true, root, label, mode }` or
  `{ success: false, error: 'This conversation has no code folder.' }`.
- `listDir(conversationId, relDir)`: `{ success, root, label, dir, truncated,
  entries }` ([DirectoryListing](workspace/DirectoryListing.md)); `''` is the root.
- `readFile(conversationId, relPath)`: see [EditorFileReader](workspace/EditorFileReader.md).
- `writeFile(conversationId, relPath, content)`: `{ success, path, size }`.
  Creates missing folders; refuses more than 8 MB and refuses to write over a
  directory.
- `createEntry(conversationId, relPath, kind)`: an empty file, or a directory
  when `kind === 'dir'`; refuses an existing name.
- `renameEntry(conversationId, relPath, toRelPath)`: refuses a missing source
  or an existing target.
- `removeEntry(conversationId, relPath)`: recursive; a missing path succeeds.

Path methods throw for no folder, a missing path, a NUL byte, an absolute path
or an escape (`ContainedPath.resolveWithin` with label `code folder`). The IPC
controller ([WorkspaceFileIpcHandlers](workspace/WorkspaceFileIpcHandlers.md))
turns those into `{ success: false, error }`. Backslashes and leading slashes
are normalised, so `\src\a.js` and `/src/a.js` mean `src/a.js`.

## Why

Writes are plain fs, deliberately not routed through `CodeWorkspace.writeFile`:
the agent's read-before-edit ledger stamps file content, so a hand edit here
makes the agent's next blind edit fail with `FS_STALE_VERSION` and re-read,
which is exactly what should happen.
