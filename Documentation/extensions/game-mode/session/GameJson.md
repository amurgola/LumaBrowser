# GameJson

`extensions/game-mode/session/GameJson.js`

Reads a game folder's `game.json` (name and kind). Missing or broken files read as null instead of throwing.

## Methods

- `GameJson.read(gameDir)` the object or null.
- `GameJson.nameOf(gameDir)` the name string or null.
- `GameJson.kindOf(gameDir)` normalized kind (`web` when absent).
