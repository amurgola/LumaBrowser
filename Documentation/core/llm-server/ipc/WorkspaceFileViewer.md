# WorkspaceFileViewer

`core/llm-server/ipc/WorkspaceFileViewer.js`

Reads one file from the folder a conversation works on, for the tool cards'
"view file" panel.

## Methods

- `new WorkspaceFileViewer(workspaceFiles)`; the [WorkspaceFiles](../chat/WorkspaceFiles.md)
  the Code view uses (mode hook first, `meta.data.projectPath` as fallback).
- `read({ conversationId, path })` returns `{ path, content, truncated }` (content
  cut at `MAX_VIEW_BYTES`, 512 KB). Throws `conversationId and path are required`,
  `This conversation has no project folder.`, `Path escapes the project folder.`
  (the resolved path must equal the root or start with root plus a separator, so
  a sibling `proj-secrets` does not pass for `proj`) and `Not a file.`.

## Why

The chat renderer has no fs access, and a card from a hostile transcript must not
read outside the folder.
