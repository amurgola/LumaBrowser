# GameMacroRunner

`core/games/GameMacroRunner.js`

Replays a saved game macro's steps through [GameController](GameController.md).

## Methods

- `new GameMacroRunner({ controller, sleep })`.
- `run(name, steps, hwnd)` runs the steps in order on that window and resolves
  `{ success: true }`, or stops at the first failing step:
  `Macro "<name>" stopped at step <n>: <error>` (a later step built on a failed
  one would act on the wrong screen).

Step kinds ([GameMacroStep](GameMacroStep.md) validated them when saved):
`press` (`holdMs`, `gapMs`, `mode`) -> `pressKeys`, `hold` (`ms`, `mode`) ->
`holdKey`, `mouse: { dx, dy, durationMs }` -> `moveMouseRelative`, `click: {...}`
-> `clickUI`, `wait: 'still'|'change'` (`timeoutMs`) -> the frame watchers, and
`wait: <ms>` a plain pause capped at `MAX_WAIT_MS` (10000).
