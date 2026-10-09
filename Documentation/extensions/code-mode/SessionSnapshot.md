# SessionSnapshot

`extensions/code-mode/SessionSnapshot.js`

The playground panel's view model of a Code session, one source for live
mid-turn emits and the end-of-turn snapshot.

## Methods (static)

- `build(s)` -> `{ id, dir, status ('drafting'), installedId, files }`.
- `project(s)` -> `{ id, kind: 'project', status ('editing'), files }`.
- `files` rows are `{ path, ok, phase }` (`phase` defaults to `'done'`).
- `forConversation(sessions, conversationId)` -> the right shape, or null when
  the session has no workspace.
- `emit(emit, type, payload)` sends `{ type, payload }`; a missing or throwing
  observer is ignored.
