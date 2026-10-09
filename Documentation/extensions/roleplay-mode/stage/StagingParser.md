# StagingParser

`extensions/roleplay-mode/stage/StagingParser.js`

Tolerant parser for the stage call's reply.

## Methods

- `StagingParser.parse(text)` `{ characters, location, currentState, shot }` or
  null; accepts the older extraction shape and field aliases.
- `StagingParser.sliceJson(text)`, `normalizeShot(obj)`, `normalizeSlots(slots)`.
