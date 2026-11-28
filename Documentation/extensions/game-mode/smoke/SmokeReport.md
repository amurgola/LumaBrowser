# SmokeReport

`extensions/game-mode/smoke/SmokeReport.js`

Turns a smoke run result into run_game's message: what ran (live or offline, actions), the canvas, the screen check per frame (a black final frame fails the run even with zero errors), the probe, the NaN check, the playability checks ([PlayabilityNotes](PlayabilityNotes.md)), runtime errors (collector plus console-only), failed loads, warnings, console output and a stalled-loop note.

## Methods

- `format(res)` -> `{ ok, screen, checks, message, summary }`; `describeShot(shot)`. `checks` is how many kinds of CHECK finding [PlayabilityNotes](PlayabilityNotes.md) raised from the probe (`report.games`), the sampled on-screen text (`res.texts`) and the inputs sent (`report.inputs`).

A run is `ok` only when the canvas mounted, no runtime error was seen, the last frame is not black and no object
has a NaN position ([PhaserProbeReport](PhaserProbeReport.md)`.nanObjects`). The last rule exists because a game
can boot, paint its backdrop and throw nothing while every moving object sits at NaN: an `update` registered as a
timer callback gets no frame time, so every position becomes NaN and nothing falls or is drawn. Such a game used
to come back "clean, screen ok" and the card offered Play. The report now says how many objects are affected and
names the usual cause; the summary reads `smoke · NaN positions`. It does not check that anything moves: a still
menu or a turn based game is legitimately static, so only NaN, which is never intended, fails the run.

## Open checks (2026-11-27)

A CHECK is not a runtime error, so a run with no errors but open checks stays `ok: true`; its summary reads `smoke · no errors · N to check` and its closing line (`_cleanLine`) says the run proves the game boots and draws, NOT that it plays: resolve the N CHECK items (fix the code, or run again with actions that prove the point) before telling the user it is ready, and never describe play the report did not show. Without open checks the closing line is the old one (the user judges whether it plays well; tell them to press Play). A failing run is unchanged.
