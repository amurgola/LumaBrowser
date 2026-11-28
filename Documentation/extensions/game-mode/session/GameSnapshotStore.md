# GameSnapshotStore

`extensions/game-mode/session/GameSnapshotStore.js`

The game snapshot outside a chat turn: what the chat page should show now (the live session with its ended renders settled, else the stored one), and the write that keeps the stored one current when a render ends after the reply did.

## Methods

- `new GameSnapshotStore({ sessions, meta?, reconcile? })`: `sessions` is the extension's conversationId -> session record map. `meta` (default a [ConversationMeta](../ConversationMeta.md)) and `reconcile` (default [AssetRenderQueue](../assets/AssetRenderQueue.md)`.reconcile`) are test seams.
- `current(conversationId)` the [GameSnapshot](GameSnapshot.md) to draw, or null for a conversation with no game yet. A live session (one with a `workspaceId`) is reconciled first; when that changed an asset the new snapshot is also saved. With no live session (the app restarted, so no render is queued any more) it returns the stored `meta.data.game`; when that still lists `pending` assets they come back as `placeholder` and the settled snapshot is saved back (`_stored`), so a strip never waits for art that will not come.
- `save(conversationId)` stores the live session's snapshot as `meta.data.game` (`ConversationMeta.saveGame`); false without a live session or when the snapshot cannot be made.

## Who calls it

[GameModeExtension](../GameModeExtension.md) creates one per activation: its API's `snapshotFor` is `current` (what [GameRoutes](../routes/GameRoutes.md) `GET /state/:convId` answers), and [GameTurnBuilder](../mode/GameTurnBuilder.md) calls `save` after each asset render ends.

## History

New 2026-11-27, when asset renders became background tasks that end after the reply, when no chat event can carry the change.
