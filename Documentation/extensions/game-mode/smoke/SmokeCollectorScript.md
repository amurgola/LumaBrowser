# SmokeCollectorScript

`extensions/game-mode/smoke/SmokeCollectorScript.js`

The in-page collector, installed as a main-world preload: records errors, resources, console output and frames; traps the `Phaser.Game` instance for the probe; drives the scripted actions (or Space taps and centre clicks); exposes `__lumaSmokeCanvasRect` and `__lumaSmokeReport`. The probe counts, per scene, the objects whose `x` or `y` is a number and NaN (`nan`) and flags each listed object the same way; an object type with no position at all is not counted. Plain ES5 with no backticks or script terminators. A game is listed once even when Phaser's bundle assigns `window.Phaser` twice (the second assignment wraps the already wrapped `Game`).

## Playability probes (2026-11-27)

Each probed scene also carries:

- `bodies`: up to 6 arcade bodies that do not match the art the player sees, each `{ tex, art, body }` (rounded `{ x, y, w, h }` world boxes). The art box is the opaque part of the frame (`trimOf`: the frame drawn to a canvas, pixels with alpha above 32, cached per texture and frame; null for a tainted image or one over 1 megapixel) placed where the frame is drawn (`drawnRect`, origin, scale and flip applied, rotation left out). `bodyMismatch` reports a body far bigger than the art (1.8 times the area and more than 12px past it), one sitting mostly beside it, or an immovable or static body whose art reaches more than 24px past it (the player passes through what looks solid). A moving sprite with a hitbox smaller than its art is a design choice and is not reported; hidden, rotated (over 0.35 rad) and disabled bodies are skipped.
- `strays`, `strayCount`: textured, visible, non-text objects more than a whole screen outside the main camera's view (`strayObject`; up to 3 listed). Objects just past an edge are inside that margin.
- `backdrop`: `{ tex, rect, covered }` when the scene has images of at least half the view's area and together they cover less than 85% of the view (`backdropGap`), else null. Coverage is measured on a 20 x 20 grid of points over the view, so two big images over the same part of the screen count once.
- A Text object's `tex` in the per-object list is `text:<its text>` (first 24 chars), even though Phaser gives it a texture.

`window.__lumaSmokeTexts()` returns the JSON list of the visible strings on the active scenes (`collectTexts`: containers walked, hidden or alpha 0 objects and whitespace-only strings skipped, whitespace folded, 40 chars each, at most 12), which [SmokeRunner](SmokeRunner.md) samples at every frame.

## Methods

- `source(runMs, actions)` the script text; `inject(html, collector)` puts it ahead of everything else in a document.
