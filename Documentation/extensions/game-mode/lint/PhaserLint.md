# PhaserLint

`extensions/game-mode/lint/PhaserLint.js`

The phantom Phaser API check on generated game code: calls eslint passes but Phaser 3 does not have. Findings ride every write and edit result.

## Methods

- `lint(source)` -> `[{ line, id, message }]`, one per rule and line, at most 20.
- `formatFindings(findings)` `PHASER API CHECK: N call(s) here will fail at runtime: ...`, or `''`.
- `lineAt(src, index)`.
