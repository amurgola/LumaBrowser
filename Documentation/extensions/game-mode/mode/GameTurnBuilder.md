# GameTurnBuilder

`extensions/game-mode/mode/GameTurnBuilder.js`

The server-side config of one Game turn. With a premise and `context.code`, the agent gets the file tools, the asset tools and (AI games) `test_ai_prompt`, pinned through `allowedTools` (plus `validate_code`, `search_knowledge_base`), on a forced agentic path with a 40-iteration, no-timeout budget. Otherwise it is a design chat. Always `noBrowser`, `kbScope: gamedev`, temperature 0.4.

## Methods

- `new GameTurnBuilder({ context, sessions, folders, gatewayInfo, aiSurface })`; `build({ meta, conversationId, modelRef })`. Each turn clears the session's whole-read guard (earlier turns roll out of the window).
