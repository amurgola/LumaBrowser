# ConsistencyProbe

`extensions/roleplay-mode/lab/ConsistencyProbe.js`

Grades a finished text playthrough for consistency without a judge model.

## Methods

- `ConsistencyProbe.run({ data, transcript, facts })` -> `{ checks: [{ id,
  label, ok, detail }], passed, total, score }`. Per fact: still in the final
  narrator context (`<id>:retained`), recalled in the reply to `askTurn`
  (`<id>:recalled`), a dead character never speaks after `deathTurn`
  (`<id>:dead`). Always: the player never gets a speaker line
  (`player:agency`) and the story counted every turn (`story:turns`).

## Changes (2026-11-09, record checks)

Two checks read the stored records rather than the prose: `<fact>:offstage` (a character with a seeded death is neither `state.present` nor listed in `currentState.characters`) and `player:cast` (no roster character bears the protagonist's name). They were added after one helper run left the dead lamplighter listed as present and another added the player to the cast while every prose check passed.
