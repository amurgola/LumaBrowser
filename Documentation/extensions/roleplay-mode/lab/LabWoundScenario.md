# LabWoundScenario

`extensions/roleplay-mode/lab/LabWoundScenario.js`

The Lab's wound playthrough (`npm run rp:text -- --scenario wound`). Raiders
hit a patrol at a river ford. Ser Aldric loses his sword arm below the elbow,
and the player, his squire Wren and Brother Odo (a monk who serves as surgeon)
have to stop the bleeding and sear the stump. They watch a raider stabbed in
the belly die, then deal with the wound going bad three days later.

The wound becomes a standing condition rather than one player line, so the run
grades whether blood, shock, searing, death and infection behave like real
bodies across turns ([PhysicalityJudge](PhysicalityJudge.md)).

## Methods

- `LabWoundScenario.build()` -> `{ name: 'wound', data, turns, facts, judges:
  ['physicality'] }`.
- `data()`, `canned()`.
