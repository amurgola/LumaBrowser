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
