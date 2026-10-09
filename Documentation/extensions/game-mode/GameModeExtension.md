# GameModeExtension

`extensions/game-mode/GameModeExtension.js`

Activates Game mode: seeds the knowledge base, registers the `game` chat mode, and returns the API `routes.js` reaches through `context.extensionApi`. The entry `main.js` is a thin `{ activate, deactivate }` over it.

## Methods

- `GameModeExtension.activate(context)` -> `{ gamesRoot, gameDirFor(id), sanitizeConvId(id), ai (GameAiSurface), gatewayInfo }`.
- `new GameModeExtension(context, { folders? })`, `execute()`.

## Shared state

One `sessions` Map (conversationId -> session record) per activation, shared by the descriptor, the tools and the AI surface. `gatewayInfo` starts `{ baseUrl: null }` and is filled by `routes.js` when core mounts the routes (core hands the address only to the route factory); `run_game` uses it to load the live play page for AI games. `deactivate()` does nothing: the extension manager unregisters chat modes.

## Chat-page bundle

`chat-ui.js` is a module entry the LLM tab's chat-extension loader injects from `/llm-ui/ext/game-mode/chat-ui.js`; it registers [GameChatMode](ui/GameChatMode.md) with `window.LumaChatExt`. `game.css` is the legacy stylesheet (em-dashes removed from comments); its `[hidden]` guard is held by `ui/GameCssHiddenGuard.test.js`.
