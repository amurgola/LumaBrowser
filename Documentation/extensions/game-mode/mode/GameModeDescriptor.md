# GameModeDescriptor

`extensions/game-mode/mode/GameModeDescriptor.js`

The `game` chat mode descriptor registered through `context.chat.registerMode`.

## Methods

- `build()` -> `{ id: game, label, icon, description, requirements: [llm], chatUiUrl, setupSchema, workspaceRoot, buildTurn, postProcess, onConversationDeleted }`.
- `workspaceRoot({ conversationId, meta })` the game folder for the chat's Code tab, labelled with the game name.
- `postProcess({ conversationId, meta, emit, setMeta, aborted })` drains queued assets (or drops them when aborted), saves the snapshot as `meta.data.game` and emits `game:state`. Files on disk are never discarded.
- `onConversationDeleted({ conversationId })` removes the session, the store cache entry and the whole folder (code, assets, AI data).
