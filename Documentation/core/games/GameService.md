# GameService

`core/games/GameService.js`

Game mode's single entry point: the `game_*` MCP tools ([GamesMcpTools](GamesMcpTools.md))
call only this. It ties [GameController](GameController.md) (scan-code keys, held
keys, relative mouse, frame hash) and the per-game sessions
([GameSessionStore](GameSessionStore.md), [GameSession](GameSession.md)) to the
safety policy.

## Safety policy

- Anti-cheat refusal ALWAYS applies, at session start, at allow and before every
  input, on top of DesktopService's own guard rails. An executable Windows will
  not name is refused too: a protected game is exactly the kind of process that hides it.
- No input is sent until the user approved `game_allow` (a mutating tool, so the
  chat asks them) for this exact executable.

## The loop

Pause-then-plan: act, wait for the screen to settle, look, decide. Each input
action is one step; after it the frame is hashed (after `settleMs`, default 250)
so the session can tell the agent when its actions stop having any visible
effect (stuck) and when to write a progress summary. That fits turn-based and
pausable games; a vision look costs about 0.8 s, far too slow for reflexes.

## Methods

All return `{ success, data }` or `{ success: false, error }`.

- `new GameService({ controller, store, sleep?, settleMs = 250 })`; `desktop` getter.
- `start({ hwnd|window, gameId? })` opens or reopens the session (read-only, sends
  no input): `{ gameId, hwnd, allowed, text, status }`; `text` is the briefing plus a
  CAPTURE note (screen-region capture for Direct3D games, or a failure) and either
  `NEXT: call game_allow ...` or the `LOOP: ...` hint.
- `allow()` pins the approval to the window's executable: `{ gameId, allowed: true, exe }`.
- Steps (gate, session, refusal and approval first; the controller's result data
  plus `step`: `{ stepCount, stuck, summarizeDue, changed?, ... }`): `press(args)`,
  `hold(args)`, `mouseMove(args)`, `click(args)`. A failed input is not a step.
- `calibrateMouse(args)` not a step; a successful result's advice is saved as a
  `calibration` note.
- `wait({ for = 'still'|'change', timeoutMs, stableMs, minDistance, screenshot = true })`
  not a step (waiting sends no input): the watcher's result plus `status`, and the
  window `image` (DesktopService.screenshot data) unless `screenshot: false`.
- `setGoals(goals)`, `note({ text, kind, key, action })` (text, or a `control`
  note with key and action), `saveMacro({ name, steps })`, `status()`.
- `runMacro({ name })` replays a saved macro through [GameMacroRunner](GameMacroRunner.md),
  stopping at the first failing step; counts as ONE step (the macro is the agent's
  unit of intent). Unknown names list the known ones.

Without a session: `No game session. Call game_start_session with the game window
first.`; when its window is gone the resolve error plus `Call game_start_session again.`
