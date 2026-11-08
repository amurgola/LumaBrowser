# LabJungleScenario

`extensions/roleplay-mode/lab/LabJungleScenario.js`

The Lab's jungle playthrough (`npm run rp:text -- --scenario jungle`). Ines and
Kofi reach a mission station with the player after five days on foot in the
jungle, the last three sick with dysentery. Both start with that standing
condition; Sister Agathe does not.

The turns cover the latrine, dehydration, washing hair and feet, vomiting, an
evening where Ines (washed, still sick) sits close and kisses the player, and
a fever before dawn. The run grades whether hygiene and illness change what
bodies look, smell, feel and do, and whether the change from filthy to washed
is honoured rather than ignored or wiped away in one scene
([PhysicalityJudge](PhysicalityJudge.md)).

## Methods

- `LabJungleScenario.build()` -> `{ name: 'jungle', data, turns, facts,
  judges: ['physicality'] }`.
- `data()`, `canned()`.
