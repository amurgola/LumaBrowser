# PhaserLintRules

`extensions/game-mode/lint/PhaserLintRules.js`

The regex rules of the phantom Phaser API check, each a hallucination a local model actually shipped: `geom-path`, `fillpath-arg`, `body-refresh`, `keyevent-concat`, `v2-game-global`, `v2-anchor`, `v2-arcade-const`, `v2-keyboard-isdown`, `stroke-arg-order` (colour where the line width goes: the black-screen bug), `v2-constructor`.

## Methods

- `RULES` `[{ id, re, message }]`, `message` a string or a function of the match.
