# WorkspaceFileIpcHandlers

`core/llm-server/chat/workspace/WorkspaceFileIpcHandlers.js`

IPC controller for the Code view. Routes only; the logic is in
[WorkspaceFiles](../WorkspaceFiles.md).

## Methods

- `WorkspaceFileIpcHandlers.register(ipcMain, workspaceFiles)` registers
  `core.llmServer.chat.workspace.<name>` for:

| name | args | calls |
|---|---|---|
| `info` | `{ conversationId }` | `info(id)` |
| `list` | `{ conversationId, dir }` | `listDir(id, dir or '')` |
| `read` | `{ conversationId, path }` | `readFile(id, path)` |
| `write` | `{ conversationId, path, content }` | `writeFile(id, path, content)` |
| `create` | `{ conversationId, path, kind }` | `createEntry(id, path, kind)` |
| `rename` | `{ conversationId, path, to }` | `renameEntry(id, path, to)` |
| `remove` | `{ conversationId, path }` | `removeEntry(id, path)` |

Every handler is wrapped in `IpcEnvelope.enveloped`: a missing
`conversationId` or any thrown fs or containment error comes back as
`{ success: false, error }`, which the editor renders in place. Results that
already carry `success` pass through unchanged.
