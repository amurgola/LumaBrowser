# GameRoutes

`extensions/game-mode/routes/GameRoutes.js`

Controller for `/api/ext/game-mode` (the entry `routes.js` calls `GameRoutes.create(context)`): `GET /play/...` (no-store, served relative to the game root so dotfiles never leak), `GET /state/:convId` (`{ success: true, game }` from `extensionApi.snapshotFor`, `game` null for a conversation with no game yet; 404 `unknown game` for an unusable id), `POST /open-tab/:convId` (`context.browser.createTab`, 503 without it), `GET /export/:convId`, `POST /publish/:convId`, `POST /room/:convId`, plus the `/ai` routes. It also publishes `gateway.baseUrl` into `extensionApi.gatewayInfo` and registers the room relay on `gateway.registerUpgrade('/ws')`.

## Methods

- `GameRoutes.create(context)` -> an express Router.

## Status snapshot (2026-11-27)

`GET /state/:convId` is how the chat page's game strip catches up after the reply: asset renders now end after the turn, when no chat event can carry the change. The id goes through `sanitizeConvId`; the snapshot is [GameSnapshotStore](../session/GameSnapshotStore.md)`.current`.

## Entry page (2026-11-14)

`GET /play/...` sends the game's own index.html through `PlayRequest.entryHtml` (html, still no-store; 404 if unreadable) so it carries the no-scrollbar rule; every other file is still `sendFile`. ISSUES.md 32.
