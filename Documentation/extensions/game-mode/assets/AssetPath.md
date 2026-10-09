# AssetPath

`extensions/game-mode/assets/AssetPath.js`

Normalizes and guards an asset path: a `.png` under `assets/` that resolves inside the game folder. Binary asset writes bypass CodeWorkspace, so this is their containment check.

## Methods

- `resolve(gameRootAbs, rawPath)` `{ rel, abs }` or `{ error }` (backslashes and a leading `./` tolerated; `ContainedPath.resolveWithin` decides escape).
