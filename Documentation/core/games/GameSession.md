# GameSession

`core/games/GameSession.js`

What the agent knows about one game, saved on every change through the persist
callback [GameSessionStore](GameSessionStore.md) gives it.

## Why persisted

The long-running game agents that got anywhere (Claude and Gemini playing
Pokemon, Voyager-style harnesses) kept a structured goals file and a notes file
outside the model's context and re-read them at every restart. Without them a
fresh context re-learns the controls and wanders.

## Fields

- `profile` (persisted): `{ gameId, title, exe, allowed, allowedExe, controls,
  notes, goals: { primary, secondary, tertiary }, macros, stepCount,
  lastSummaryStep, createdAt, updatedAt }`. GameService writes `title` and `exe`.
- `hwnd`, `lastHash` (runtime only, read and written by GameService).
- `gameId` getter.

The recent frame hashes and actions the stuck detector uses are runtime only:
yesterday's screen says nothing about today.

## Methods

- `save()` stamps `updatedAt` and persists.
- `isAllowedFor(exe)` the user's approval is pinned to the executable
  (normalized, case-insensitive), so another program sharing a title or game id
  is not covered. `allow(exe)` throws without an exe.
- `setGoals(goals)` sets only the given goals (1000 chars each); returns them.
- `addNote({ text, kind = 'note', key, action })` keeps the newest 200 notes
  (2000 chars). `kind 'control'` with key and action records a control
  (key lower-cased); `kind 'summary'` resets the summary counter.
- `saveMacro(name, steps)` name 1-40 of `a-z0-9_-` (lower-cased), 1-50 steps
  each valid per [GameMacroStep](GameMacroStep.md), at most 50 macros (overwriting
  is always allowed). Returns the name. `getMacro(name)` or null.
- `recordStep({ hash, action })` counts one input step and returns `status()`.
- `isStuck()` the last 5 steps all ended within 6 bits of the same frame: none
  of the recent inputs had a visible effect (a modal dialog, a wall, a menu
  wanting another key, a game ignoring injected input).
- `summarizeDue()` 100+ steps since the last summary note.
- `status()` `{ stepCount, stuck, summarizeDue, suggestion?, summaryHint? }`;
  the suggestion lists what was tried and what to try instead.
- `describe()` the briefing text ([GameBriefing](GameBriefing.md)).
- Statics: `STUCK_STEPS` 5, `STUCK_DISTANCE` 6, `SUMMARY_EVERY` 100, `MAX_NOTES`,
  `MAX_MACROS`, `MAX_MACRO_STEPS`.
