# GameTurnBuilder

`extensions/game-mode/mode/GameTurnBuilder.js`

The server-side config of one Game turn. With a premise and `context.code`, the agent gets the file tools, the asset tools and (AI games) `test_ai_prompt`, pinned through `allowedTools` (plus `validate_code`, `search_knowledge_base`), on a forced agentic path with a 40-iteration, no-timeout budget. Otherwise it is a design chat. Always `noBrowser`, `kbScope: gamedev`, temperature 0.4.

## Methods

- `new GameTurnBuilder({ context, sessions, folders, gatewayInfo, aiSurface, snapshots? })`; `build({ meta, conversationId, modelRef })`. `modelRef` is the model the composer sent the turn on; `languageModel` decides the turn's model, which is both the returned `modelRef` and the one handed to the tools (run_game's vision gate). The asset tools get `onAssetSettled`, which calls `snapshots.save(conversationId)` ([GameSnapshotStore](../session/GameSnapshotStore.md)) after each render ends.
- `static languageModel(data, composerModelRef)` the game's own pick (`data.llmModel`, trimmed) when set, else `composerModelRef`. Each turn clears the session's whole-read guard (earlier turns roll out of the window). The asset tools get the setup art style, image-model pins and locked palette ([GamePalettes](../assets/GamePalettes.md)`.resolve`).
