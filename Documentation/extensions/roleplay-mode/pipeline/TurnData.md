# TurnData

`extensions/roleplay-mode/pipeline/TurnData.js`

The per-turn working copy of a conversation's roleplay data: shallow per
character, scene and record, with each character's `profile`, `chronicle` and
`state` and the `story` record copied deeply (the reconciliation writes into
them), so the passed meta is never mutated.

## Methods

- `TurnData.from(meta)`, `TurnData.wasEmpty(meta)`.
