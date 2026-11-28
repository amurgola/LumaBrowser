# PlayabilityNotes

`extensions/game-mode/smoke/PlayabilityNotes.js`

The lines of a run_game report about whether the game can be played, beyond booting and drawing: collision bodies that do not match the art the player sees, objects that ended up far off screen, a backdrop that leaves the screen bare, and what the on-screen text said at each frame (a score that never moved). Each finding is a CHECK for the agent, not a runtime error.

## Methods

- `build({ games, texts, inputs })` -> `{ lines, checks }`. `games` is the probe array of the in-page report ([SmokeCollectorScript](SmokeCollectorScript.md)), `texts` the `[{ label, at, texts }]` samples [SmokeRunner](SmokeRunner.md) took per frame, `inputs` how many inputs the run sent. `checks` counts the kinds of finding (hitboxes, off screen, backdrop, progress), not the lines; the text timeline is information and never counts.

## The lines, in order

- `CHECK hitboxes:` every scene's `bodies` together, up to `MAX_BODIES` (4) as `[tex] visible art WxH at (x,y), collision body WxH at (x,y)`, then how to fix it (`body.setSize` with `setOffset`, or `setDisplaySize`; the default origin is the centre).
- `CHECK off screen:` one line per scene with `strayCount > 0`: the count, the listed strays, and the usual cause (adding a sprite to a physics group resets its body to the group defaults, so gravity carries it off; set `allowGravity` / `immovable` after `group.add()` or in the group config), or destroy spent objects.
- `CHECK backdrop:` one line per scene with a `backdrop`: the image, where it is drawn, the share of the screen the big images cover, and the centre-origin reminder.
- `ON-SCREEN TEXT at each captured frame:` then one `- <label>: "text", ...` line per run of consecutive frames with the same text (`<first> to <last>` when folded), up to `MAX_TEXTS` (6) strings and an ellipsis; `(no text)` for an empty frame. Left out when no frame had any text.
- `CHECK progress:` when the run sent input, had at least two frames, showed a number in some frame, and the distinct numbers of every frame were the same: nothing on screen moved (score, timer, lives), so the run did not show the player getting anywhere; run again with actions that play one success. A number repeated within a frame (a game-over panel repeating the score) adds no new value.

## Who calls it

[SmokeReport](SmokeReport.md) after the NaN check; its `checks` decides the clean run's summary and closing line.

## History

New 2026-11-27. A smoke run that booted and drew used to read as "clean" even when the hero collided with empty space or the score never moved, and agents reported play the run never showed.
