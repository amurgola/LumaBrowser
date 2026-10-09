# GameBriefing

`core/games/GameBriefing.js`

The text an agent reads when it (re)starts a game session.

## Methods

- `GameBriefing.describe(profile)` lines: `GAME: <title or id> (gameId <id>), step <n>`,
  `ALLOWED: yes|no (ask the user to approve game_allow before any input)`, the
  three goals (`(none)` when empty), `CONTROLS: k=v, ...` or
  `CONTROLS: (none learned yet)`, `MACROS: ...` when any, the latest summary as
  `LAST SUMMARY (step <n>): ...`, and up to 10 other recent notes as
  `  [<step> <kind unless note>] <text>`.
