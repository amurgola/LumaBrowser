# GameRoutes

`extensions/game-mode/routes/GameRoutes.js`

Controller for `/api/ext/game-mode` (the entry `routes.js` calls `GameRoutes.create(context)`): `GET /play/...` (no-store, served relative to the game root so dotfiles never leak), `POST /open-tab/:convId` (`context.browser.createTab`, 503 without it), `GET /export/:convId`, `POST /publish/:convId`, `POST /room/:convId`, plus the `/ai` routes. It also publishes `gateway.baseUrl` into `extensionApi.gatewayInfo` and registers the room relay on `gateway.registerUpgrade('/ws')`.

## Methods

- `GameRoutes.create(context)` -> an express Router.
