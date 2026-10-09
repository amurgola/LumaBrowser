# SmokeActions

`extensions/game-mode/smoke/SmokeActions.js`

The scripted input of a smoke run, normalised: `click` (x, y), `key` (named or single character, held 60-4000 ms) and `type` (up to 120 chars), each with `at` (0-30 s), at most 24, sorted by time.

## Methods

- `normalize(raw)`, `describe(action)` (`click (x,y) @1.5s`, `key E held 600ms @2.0s`, `type "hi" @2.0s`).
