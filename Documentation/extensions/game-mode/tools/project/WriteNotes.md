# WriteNotes

`extensions/game-mode/tools/project/WriteNotes.js`

Notes appended to a write or edit result.

## Methods

- `phaserApi(dir, relPath, content)` the [PhaserLint](../../lint/PhaserLint.md) block for `.js`/`.html` files (content null reads the file back).
- `indexWiring(dir, relPath)` for a `src/` file index.html does not mention: a NOTE to add its script tag (a src file index.html never lists never runs).
