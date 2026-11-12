# PressureCall

`extensions/roleplay-mode/pipeline/PressureCall.js`

Runs the story-editor completion that sets the pressure line and pins the
premise's central thread. Best effort: a failure leaves the story untouched.

## Methods

- `new PressureCall(chat, logger)`.
- `PressureCall.due(data)` false on the opening turn (there is no story to
  press on yet). From turn 2: true when no reading was ever taken
  (`pressureTurn` 0), when a story summary has been written since the last one
  (`summaryTurn > pressureTurn`), and every `REFRESH_TURNS` (5) turns. Also
  true when the pressure is empty and at least `EMPTY_TURNS` (2) turns have
  passed since `pressureTurn`: the stage call cleared a line the story moved
  past ([StoryLedger](../world/StoryLedger.md)`.keepPressure`, which leaves
  `pressureTurn` alone), and a new one is due after a turn's breathing room.
  The same holds after the story editor itself answered with an empty
  pressure.
- `PressureCall.request(data, content)` temperature 0.3, 60 s, `noThink`, the
  setup's model.
- `run(data, content)` writes [StoryLedger](../world/StoryLedger.md)`.setPressure`
  and `pinThread`; true when either changed. An empty pressure is an answer
  too (nothing presses yet): it clears a stale line and dates the reading, so
  the call is not repeated on the next turn. An unusable reply or a failure
  changes nothing. A [ReactionScope](ReactionScope.md) stop is rethrown.

## Wiring

[RoleplayPostProcessor](RoleplayPostProcessor.md) runs it last in `_remember`,
after casting and consolidation, so a pressure line reads the summary it
follows. Written once at the opening, the line described that first moment
and the narrator replayed it for the rest of the story. The Lab mocks it by the
`story editor` marker ([LabCompletionKind](../../../core/roleplay-lab/LabCompletionKind.md)).

## Changes (2026-11-09, helper model)

The request routes on [SideModel](../mode/SideModel.md).ref(data).

## Later and stricter (2026-11-12)

`due()` is false before `FIRST_TURN` (4): asked in the first exchanges, the
story editor described whatever the passage showed. The early re-ask after an
empty answer (`EMPTY_TURNS`) is gone; an empty pressure waits for the ordinary
refresh. A returned line is stored as none when it retells the passage
(`PressurePrompt.describesPassage`) or does not look ahead
(`PressurePrompt.looksAhead`).
