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
