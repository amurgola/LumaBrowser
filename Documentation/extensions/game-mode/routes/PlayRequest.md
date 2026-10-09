# PlayRequest

`extensions/game-mode/routes/PlayRequest.js`

Resolves `GET /play/<convId>/<asset...>` to a file in that game folder: undecodable or NUL paths 400, unknown games 404, escapes 403; the default file is index.html.

## Methods

- `PlayRequest.resolve(api, reqPath)` -> `{ status }` or `{ root, file }`.
