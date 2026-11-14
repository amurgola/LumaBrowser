# PlayRequest

`extensions/game-mode/routes/PlayRequest.js`

Resolves `GET /play/<convId>/<asset...>` to a file in that game folder: undecodable or NUL paths 400, unknown games 404, escapes 403; the default file is index.html.

## Methods

- `PlayRequest.resolve(api, reqPath)` -> `{ status }` or `{ root, file }`.

## Entry page (2026-11-14)

- `resolve` also returns `entry`: true when the file is the game's own `index.html` (compared case-insensitively against the root).
- `PlayRequest.entryHtml(file)` (async) reads it and returns it with the [NoScrollbarStyle](../flatten/NoScrollbarStyle.md) rule added, or null when it cannot be read. The file on disk is untouched. This is what makes the rule hold for a game whose agent rewrote the page or that predates the scaffold rule (ISSUES.md 32).
