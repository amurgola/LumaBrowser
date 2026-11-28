# GameModeDescriptor

`extensions/game-mode/mode/GameModeDescriptor.js`

The `game` chat mode descriptor registered through `context.chat.registerMode`. `ICON` is a stroked gamepad SVG (currentColor, 1.75 stroke) that the chat sidebar renders inline.

## Methods

- `build()` -> `{ id: game, label, icon, description, requirements: [llm], chatUiUrl, setupSchema, workspaceRoot, buildTurn, postProcess, onConversationDeleted, delegate }`; `delegate` is [GameDelegate](GameDelegate.md)`.spec()` (the chat's `delegate_task` target).
- `workspaceRoot({ conversationId, meta })` the game folder for the chat's Code tab, labelled with the game name.
- `postProcess({ conversationId, meta, emit, setMeta, aborted })` settles the asset renders: when the user stopped the build (`aborted`) it cancels the conversation's renders that have not finished ([AssetRenderQueue](../assets/AssetRenderQueue.md)`.cancelAll`); then `AssetRenderQueue.reconcile` turns a pending asset whose task ended without rendering into `placeholder`. Renders still queued after a finished turn run by themselves once the reply has ended. It then sets the session's status to how the turn ended ([GameSessions](../session/GameSessions.md)`.statusAfterTurn`), saves the snapshot as `meta.data.game` and emits `game:state`. Files on disk are never discarded.
- `onConversationDeleted({ conversationId })` removes the session, the store cache entry and the whole folder (code, assets, AI data).
