# PressureCall

`extensions/roleplay-mode/pipeline/PressureCall.js`

Runs the story-editor completion that sets the pressure line and pins the
premise's central thread. Best effort: a failure leaves the story untouched.

## Methods

- `new PressureCall(chat, logger)`.
- `PressureCall.due(data)` true when the story has no pressure line yet (the
  opening turn) or a story summary has been written since the line was last
  set (`summaryTurn > pressureTurn`), so the pressure follows each summary.
- `PressureCall.request(data, content)` temperature 0.3, 60 s, `noThink`, the
  setup's model.
- `run(data, content)` writes [StoryLedger](../world/StoryLedger.md)`.setPressure`
  and `pinThread`; true when either changed.

## Wiring

[RoleplayPostProcessor](RoleplayPostProcessor.md) runs it last in `_remember`,
after casting and consolidation, so the first pressure line reads the opening
passage and later ones read the summary they follow. The Lab mocks it by the
`story editor` marker ([LabCompletionKind](../../../core/roleplay-lab/LabCompletionKind.md)).

## Changes (2026-11-09, helper model)

The request routes on [SideModel](../mode/SideModel.md).ref(data).
