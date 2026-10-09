# GameZipExporter

`extensions/game-mode/routes/GameZipExporter.js`

Streams a game as a portable zip: every file in the folder, `phaser.min.js` bundled, and index.html's engine tag rewritten to the relative copy so the unzipped game plays from a double-clicked file.

## Methods

- `fileName(root)` `<slug of game.json name>.zip`, else `game.zip` ([Slug](../../../core/shared/text/Slug.md)).
- `stream({ root, phaserPath, output, onError })` (archiver, zlib level 9).
