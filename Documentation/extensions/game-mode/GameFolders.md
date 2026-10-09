# GameFolders

`extensions/game-mode/GameFolders.js`

Where game folders live: one per conversation under `<userData>/game-mode/`, plus `.kb-cache` for fetched game-dev pages.

## Methods

- `GameFolders.resolveDataDir()` `LUMA_DATA_DIR`, else electron `userData`, else `<tmp>/lumabrowser` (tests).
- `GameFolders.sanitizeConvId(id)` keeps `[A-Za-z0-9_-]` (so `..` never survives); throws `unusable conversation id` when nothing is left.
- `new GameFolders(dataDir?)` -> `gamesRoot`, `kbCacheDir`, `gameDirFor(conversationId)`.

## Why userData

Games are the same small-data tier as SQLite and artifacts. Not userExtensionsDir (discovery would load game folders as extensions) and not appBaseDir (multi-GB model payloads).
