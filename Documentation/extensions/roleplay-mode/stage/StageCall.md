# StageCall

`extensions/roleplay-mode/stage/StageCall.js`

Runs the stage manager completion and parses it, best effort.

## Methods

- `new StageCall(chat, logger?)`; `run(data, content)` the parse or null
  (failures are logged as `roleplay stage call failed`).
- `StageCall.request(data, content)` the completion options (temperature 0.2,
  90 s timeout, `noThink`, the conversation's model).

## Changes (2026-11-09, helper model)

`request` routes on [SideModel](../mode/SideModel.md).ref(data) and sends `responseFormat: StagingPrompt.responseFormat(draws)`, so the reply is decoded under the stage schema whatever model answers.

## Stopped reactions (2026-11-12)

`run` rethrows a [ReactionScope](../pipeline/ReactionScope.md) stop instead of
logging it as a failed call and returning null. A regenerate or an edit that
stopped the reaction ends it there; it used to run on into casting calls that
each failed the same way and logged a warning apiece.
