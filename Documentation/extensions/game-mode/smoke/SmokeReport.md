# SmokeReport

`extensions/game-mode/smoke/SmokeReport.js`

Turns a smoke run result into run_game's message: what ran (live or offline, actions), the canvas, the screen check per frame (a black final frame fails the run even with zero errors), the probe, runtime errors (collector plus console-only), failed loads, warnings, console output and a stalled-loop note.

## Methods

- `format(res)` -> `{ ok, screen, message, summary }`; `describeShot(shot)`.

A run is `ok` only when the canvas mounted, no runtime error was seen, the last frame is not black and no object
has a NaN position ([PhaserProbeReport](PhaserProbeReport.md)`.nanObjects`). The last rule exists because a game
can boot, paint its backdrop and throw nothing while every moving object sits at NaN: an `update` registered as a
timer callback gets no frame time, so every position becomes NaN and nothing falls or is drawn. Such a game used
to come back "clean, screen ok" and the card offered Play. The report now says how many objects are affected and
names the usual cause; the summary reads `smoke · NaN positions`. It does not check that anything moves: a still
menu or a turn based game is legitimately static, so only NaN, which is never intended, fails the run.
