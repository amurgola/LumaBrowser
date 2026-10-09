# GameFlattener

`extensions/game-mode/flatten/GameFlattener.js`

Collapses a game folder into one self-contained HTML document: Phaser inlined, every local script inlined in order (`</script` escaped), every referenced `assets/` file a data: URI. Share links serve it verbatim; smoke runs load it.

## Methods

- `flatten(gameDir, { sourceUrls })` -> `{ html, bytes, inlinedScripts, inlinedAssets }`; `sourceUrls` stamps `//# sourceURL=<path>` so stack traces keep file names. Throws `phaser dist not found, cannot flatten`.
- `escInline(js)`.

## Containment

External and absolute script sources are left alone, and a source resolving outside the game folder (`ContainedPath.resolveWithin`) is never read.
