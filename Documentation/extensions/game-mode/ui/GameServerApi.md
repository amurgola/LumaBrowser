# GameServerApi

`extensions/game-mode/ui/GameServerApi.js`

The Game mode routes the chat page calls under `/api/ext/game-mode`.

## Methods

- `GameServerApi.playUrl(convId, bust)`: `<origin>/api/ext/game-mode/play/<convId>/index.html`,
  plus `?ts=<now>` when `bust`; `about:blank` without a conversation.
- `GameServerApi.openTab(convId)`: `POST /open-tab/<convId>`; rejects
  `open-tab <status>` when not ok.
- `GameServerApi.exportZip(convId)`: `GET /export/<convId>` ->
  `{ blob, filename }` (the Content-Disposition name, else `game.zip`);
  rejects `export <status>`.
- `GameServerApi.publish(convId)`: `POST /publish/<convId>` -> the body.
- `GameServerApi.resetStores(convId)`: `DELETE /ai/<convId>/store` -> the body.

`publish` and `resetStores` reject with the body's `error`, else
`publish <status>` / `reset <status>`, unless the response is ok and the body
has `success`.

## Globals

Reads `fetch`, `location.origin`.
