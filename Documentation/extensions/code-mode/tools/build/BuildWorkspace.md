# BuildWorkspace

`extensions/code-mode/tools/build/BuildWorkspace.js`

One conversation's build session for the extension-builder tools.

## Methods

- `new BuildWorkspace({ code, sessions, conversationId, meta })` (`code` is `context.code`).
- `code` (getter).
- `current()` -> the session, or null before the first write.
- `ensure()` creates the staging workspace on first use with
  `code.createWorkspace({ name: BuildName.derive(meta), overwrite: true })` and
  records `{ workspaceId, id, dir, files: Map, status: 'drafting', installedId: null }`.
  `overwrite` lets a rebuild replace the prior attempt; context.code still
  refuses built-in ids.
- `forget()` drops the session.
- `emitState(emit, s)` emits `build:state` with the [SessionSnapshot](../../SessionSnapshot.md)
  build shape, or null for a null session.
