# NoScrollbarStyle

`extensions/game-mode/flatten/NoScrollbarStyle.js`

The style rule the app adds to every game page it serves for Play and to every flattened or exported copy, so a canvas a few pixels larger than the frame never puts scrollbars over a full window game, whatever the game's index.html says.

## Methods

- `NoScrollbarStyle.apply(html)` returns the page with `TAG` added once: just before `</head>`; with no head, just before `<body>`; with neither, right after the doctype (so the page stays in standards mode); else at the very start. A page that already contains `MARKER` comes back unchanged. No line break is added, so line numbers in the page stay the same.
- `TAG`: `<style data-luma-no-scrollbars>html, body { overflow: hidden; }</style>`. Not `!important`, on purpose: placed last in the head it already beats an ordinary rule in the game's own stylesheet (the case that put scrollbars over games), while a game whose page is meant to scroll, such as a text adventure laid out in the document, can still say so with `!important` or a style attribute on body.
- `MARKER`: `data-luma-no-scrollbars`, the idempotency check.

## Used by

- [PlayRequest](../routes/PlayRequest.md) `entryHtml`, for `GET /play/<convId>/` and `/index.html` ([GameRoutes](../routes/GameRoutes.md)). The smoke runner's live mode loads this URL.
- [GameFlattener](GameFlattener.md), for share links ([GamePublisher](../routes/GamePublisher.md)) and the smoke runner's offline mode (the flat page written to `game.html`).
- [GameZipExporter](../routes/GameZipExporter.md), for the zipped index.html.

The file on disk is never changed.

## Why

ISSUES.md 32: the rule first lived only in the placeholder index.html that `GameScaffold` writes when the file is absent. The agent owns and may rewrite that file, and games made before the fix never had it.
