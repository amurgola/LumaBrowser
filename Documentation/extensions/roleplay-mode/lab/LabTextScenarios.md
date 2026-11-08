# LabTextScenarios

`extensions/roleplay-mode/lab/LabTextScenarios.js`

The Lab's scripted text playthroughs by name: `harbour` (the default memory
and prose run, [LabTextScenario](LabTextScenario.md)), `body` (the
body-variation run, [LabBodyScenario](LabBodyScenario.md)) `reveal` (new
physical detail revealed, then recalled after it left the history,
[LabRevealScenario](LabRevealScenario.md)), `wound` (a knight's arm taken at
a ford, [LabWoundScenario](LabWoundScenario.md)), `jungle` (five days
lost and sick, [LabJungleScenario](LabJungleScenario.md)) and `control` (an
ordinary morning where no card should fire,
[LabControlScenario](LabControlScenario.md)).

## Methods

- `LabTextScenarios.resolve(which)` -> `{ name, data, turns, facts, judges,
  canned }` from a name or nothing (the default); a built scenario object is
  returned as is. Throws on an unknown name.
- `names()`.
