# GameSessions

`extensions/game-mode/session/GameSessions.js`

Gets or creates the session record that binds a conversation to its game folder, scaffolding it and registering it as a CodeWorkspace project through `context.code.openProject`.

## Methods

- `GameSessions.ensure({ context, conversationId, sessions, gameDir, name, kind })` returns the existing record when it has a `workspaceId`, else a new `{ workspaceId, id, dir, kind: 'game', gameKind, files, assets, readWhole, assetTasks, calls, served, status }`. `assetTasks` maps an asset whose render is queued or running to its background task id ([AssetRenderQueue](../assets/AssetRenderQueue.md)); it replaced the `pendingAssets` queue the post-turn drain used to empty.
- `GameSessions.statusAfterTurn(session, aborted)`: the status once a build turn is over: `stopped` when the user stopped it, `error` when any file was left with problems, else `ready`.
- `GameSessions.EDITING`, `READY`, `ERROR`, `STOPPED`: the status values. A record starts `editing`.

## Status

The card's status chip follows the session: `editing` ("Building") while a build turn runs, then how that turn ended. Until 2026-11-14 nothing ever changed the status, so the chip read "Building" forever, while the game was played and shared, and "Needs fixing" could never show. [GameModeDescriptor](../mode/GameModeDescriptor.md) sets the end state after each turn and [GameTurnBuilder](../mode/GameTurnBuilder.md) puts `editing` back when the next turn is built. A game saved before the change keeps `editing` in its stored snapshot until its next turn.
