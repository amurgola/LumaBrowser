# SmokeCollectorScript

`extensions/game-mode/smoke/SmokeCollectorScript.js`

The in-page collector, installed as a main-world preload: records errors, resources, console output and frames; traps the `Phaser.Game` instance for the probe; drives the scripted actions (or Space taps and centre clicks); exposes `__lumaSmokeCanvasRect` and `__lumaSmokeReport`. Plain ES5 with no backticks or script terminators.

## Methods

- `source(runMs, actions)` the script text; `inject(html, collector)` puts it ahead of everything else in a document.
