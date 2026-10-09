# GameSessions

`extensions/game-mode/session/GameSessions.js`

Gets or creates the session record that binds a conversation to its game folder, scaffolding it and registering it as a CodeWorkspace project through `context.code.openProject`.

## Methods

- `GameSessions.ensure({ context, conversationId, sessions, gameDir, name, kind })` returns the existing record when it has a `workspaceId`, else a new `{ workspaceId, id, dir, kind: 'game', gameKind, files, assets, readWhole, pendingAssets, calls, served, status }`.
