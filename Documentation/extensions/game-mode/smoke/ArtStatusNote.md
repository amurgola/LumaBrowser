# ArtStatusNote

`extensions/game-mode/smoke/ArtStatusNote.js`

Adds to a run_game report which art is not the real image yet: queued to render after the reply, or a placeholder because its generation failed. A frame full of coloured boxes is then read as missing art, not as the game's look.

## Methods

- `append(report, session)` the [SmokeReport](SmokeReport.md)`.format` report with the art lines added to its `message` (one per line after it); the same report object when all art is real.
- `lines(session)` up to two lines over `session.assets`: `ART not rendered yet ...` naming every `pending` asset (judge layout and behaviour now, tell the user the art is on its way), and `ART that failed to generate ...` naming every `placeholder` or `error` asset (tell the user which art is missing). An asset with no status counts as done.

## Who calls it

[RunGameTool](../tools/assets/RunGameTool.md) on every run.

## History

New 2026-11-27, with asset renders moving to background tasks that run after the reply.
