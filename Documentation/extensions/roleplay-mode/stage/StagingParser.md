# StagingParser

`extensions/roleplay-mode/stage/StagingParser.js`

Tolerant parser for the stage call's reply.

## Methods

- `StagingParser.parse(text)` `{ characters, location, currentState, chronicle,
  shot }` or null; accepts the older extraction shape and field aliases. Present
  entries carry `intent`, `condition` (null when omitted, so the last reading
  stands), `bondUser`, `bondChange`, `beat`, `leftTo`. `chronicle` is
  `{ events, clock, threads }` (events capped at 6, threads at 4 each, unknown
  kinds become `event`), or null when the reply carries none of its keys.
- `StagingParser.sliceJson(text)`, `normalizeShot(obj)`, `normalizeSlots(slots)`.
