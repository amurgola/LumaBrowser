# GameMacroStep

`core/games/GameMacroStep.js`

Validates one step of a saved game macro, so a macro the runner (GameService)
would not understand is refused when saved, not halfway through a replay.

## Methods

- `GameMacroStep.validate(step, index)` throws unless the step has exactly one
  of `press`, `hold`, `mouse`, `click`, `wait` (the message shows an example of
  each), and a `wait` is `"still"`, `"change"` or milliseconds.
- `GameMacroStep.KINDS` the step kinds.
