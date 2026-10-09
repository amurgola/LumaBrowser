# GameSessionStore

`core/games/GameSessionStore.js`

Loads and saves [GameSession](GameSession.md)s, one `<dir>/<gameId>/profile.json`
per game (main.js uses `<userData>/games`).

## Methods

- `new GameSessionStore({ dir, fsImpl = fs })`; throws `GameSessionStore needs a directory`.
- `open(gameId)` the session for a sanitized id ([GameId](GameId.md)), loaded
  or new. Cached: the same id returns the same instance. A stored profile is
  merged over the defaults (goals merged too), so profiles from older versions
  gain new fields; a missing or unreadable file means a new game.
- `GameSessionStore.emptyProfile(gameId, now?)` the default profile.

## Why atomic writes

Writes are synchronous and go through a `.tmp` file plus rename: a crash
mid-write must not wipe a goals file the user built up over hours.
