# LabTextRun

`extensions/roleplay-mode/lab/LabTextRun.js`

Drives one scripted text playthrough through the REAL chat path: a
[LabTurnDriver](LabTurnDriver.md) opens a roleplay conversation in the chat
store and sends each player line through the chat router, so the mode builds
its layered context the way it does for a user, the router adds what it adds
(style documents, the thinking dial, the model's overrides), the story model
answers, and the production reaction updates the story before the next line.

## Methods

- `new LabTextRun({ router, mode, complete, Harness, emit, modelRef, contextWindow, Driver })`:
  `router` the chat router the turns go through; `mode` the roleplay
  descriptor registered on it; `complete` the judges' completion; `modelRef`
  the story model (null: the router's current one); `contextWindow(n)` a host
  hook that resizes the served window for a scenario that asks for one (the
  CLI's server stub; absent in the app, where the real window applies).
- `run({ turns?, mockSideCalls?, judge?, grounding?, scenario?, keep? })` ->
  `{ scenario, transcript: [{ turn, user, assistant, messageId, contextTokens, ms, calls, grounding?, audit }],
  data, probe, cast, prose, bodyDetail, grounding, context, calls, judge, physicality, reveal, error }`.
  `data` is the stored story state at the end (the materialized head, with
  its timeline). `contextTokens` and `audit` ([ContextAudit](ContextAudit.md))
  read the narrator request as the router dispatched it; `grounding` per turn
  is what the descriptor remembered handing the narrator
  (`RoleplayModeDescriptor.lastGrounding`); `calls` lists the model calls
  the turn made and the run's `calls` counts them by kind (the narrator with
  its wall time). `keep` leaves the hidden conversation in the store. The
  other options and the judges are as before: `scenario` a name or a built
  scenario ([LabTextScenarios](LabTextScenarios.md)); `physicality` and
  `reveal` judges per the scenario's list; `grounding: false` turns the
  story's body and surface grounding off. With `mockSideCalls` a `LabHarness`
  with the scenario's canned replies is installed; the chat the mode's side
  calls go through consults it, while the narrator (a chat turn, never a side
  call) always runs for real.
  Emits `lab:text { phase: 'turn', ... }` per turn and `lab:text { phase: 'done', ... }`.
  From the terminal: `npm run rp:text` ([TextRunCli](../../../tools/roleplay/TextRunCli.md)).

## Why

Until 2026-11-09 the run assembled the request itself (`buildTurn`, a copy
of `ModeTurnMessages`, its own thinking-off body, a 16k window, no store),
so it never saw the reply-choice document every live narrator turn carried,
the live thinking dial, or the timeline and conversation-path code. It
passed while the app misbehaved.

## Changes (2026-11-09, helper model)

`options.sideModel` ('' | 'helper' | ref) sets the story's bookkeeping model before the run.
