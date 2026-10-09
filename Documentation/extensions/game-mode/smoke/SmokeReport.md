# SmokeReport

`extensions/game-mode/smoke/SmokeReport.js`

Turns a smoke run result into run_game's message: what ran (live or offline, actions), the canvas, the screen check per frame (a black final frame fails the run even with zero errors), the probe, runtime errors (collector plus console-only), failed loads, warnings, console output and a stalled-loop note.

## Methods

- `format(res)` -> `{ ok, screen, message, summary }`; `describeShot(shot)`.
