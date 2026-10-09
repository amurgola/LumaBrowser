# GamesMcpTools

`core/games/GamesMcpTools.js`

MCP controller for the `game_*` tools (source `core.games`): definitions and a
handler routing each call to GameService. The in-app agent sees them as one lazy
"Game play" group.

## Members

- `GamesMcpTools.TOOLS` the definitions. Every input tool is `mutating: true`
  (`game_press`, `_hold`, `_mouse_move`, `_click`, `_calibrate_mouse`,
  `_run_macro`), and so is `game_allow`: the user, not the model, decides which
  game may be driven. `game_start_session`, `_set_goals`, `_note`, `_wait`,
  `_save_macro`, `_status` are not.
- `new GamesMcpTools(gameService)`; `handler()` the `(name, args)` function for
  the aggregator; `handle(name, args)` the same as a method.

## Routes

`game_start_session` -> `start(args)` (reply: the briefing text only),
`game_allow` -> `allow()`, `game_set_goals` -> `setGoals`, `game_note` -> `note`,
`game_press` -> `press`, `game_hold` -> `hold`, `game_mouse_move` -> `mouseMove`,
`game_click` -> `click`, `game_calibrate_mouse` -> `calibrateMouse`,
`game_wait` -> `wait` (reply: an image part plus the JSON result and
`Screenshot <w>x<h> px; game_click x/y use these pixels.`, or plain JSON without an image),
`game_save_macro` -> `saveMacro`, `game_run_macro` -> `runMacro`, `game_status` -> `status()`.

Success replies `McpResult.text({ success: true, data })`; failures, throws and
unknown tools reply `McpResult.error`.
