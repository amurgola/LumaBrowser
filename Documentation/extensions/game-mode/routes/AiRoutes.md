# AiRoutes

`extensions/game-mode/routes/AiRoutes.js`

Controller for `/ai/<convId>/...`, what `src/luma-ai.js` (`window.AI`) calls from a running AI game: `GET ping`, `POST complete` (429 when busy), `POST stream` (SSE `{delta}` lines then `{done, text}`; the response's close aborts), the store (`GET store`, `GET store/:col`, `PUT store/:col/:key`, `DELETE store/:col/:key`, `DELETE store/:col`, `DELETE store`) and `POST image`. 503 without the AI surface, 404 for an unknown game, 403 for a web game; a body `modelRef` is always stripped.

## Methods

- `AiRoutes.mount(router, context, api)`.
