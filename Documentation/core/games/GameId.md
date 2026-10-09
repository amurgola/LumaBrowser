# GameId

`core/games/GameId.js`

Filesystem-safe game ids. A game id names a profile folder, so it is lower-case
`a-z0-9._-`, at most 64 characters, with no leading or trailing `.` / `-`, and
never empty, `.` or `..`.

## Methods

- `GameId.from({ exe, title })` from the exe's base name without `.exe`
  (`SlayTheSpire.exe` -> `slaythespire`), else the window title
  (`Into the Breach: Advanced` -> `into-the-breach-advanced`). Throws
  `Cannot derive a game id; pass gameId.`
- `GameId.sanitize(id)` the same cleaning for a given id; throws `Invalid gameId "<id>".`
