# ProjectWorkspace

`extensions/code-mode/tools/project/ProjectWorkspace.js`

One conversation's project session for the project tools.

## Methods

- `new ProjectWorkspace({ code, sessions, conversationId, meta })`; `code`,
  `projectPath` (`meta.data.projectPath`), `conversationId` getters.
- `current()` -> the session record or undefined.
- `ensure()` opens the folder on first use (`code.openProject({ path })`) and
  records `{ workspaceId, id, dir, kind: 'project', files, readWhole, calls, served, status: 'editing' }`.
- `begin()` = `ensure()` plus a call count; every tool starts with it.
- `trackFile(s, relPath, ok)` marks the file changed and drops its whole-read claim.
- `emitState(emit, s)` emits `project:state` ([SessionSnapshot](../../SessionSnapshot.md)`.project`).
- `recordServed(result)` adds `result.message.length` to `served`.
