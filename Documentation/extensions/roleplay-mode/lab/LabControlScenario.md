# LabControlScenario

`extensions/roleplay-mode/lab/LabControlScenario.js`

The Lab's negative control for grounding (`npm run rp:text -- --scenario
control`). It is an ordinary weekday morning: a crosswalk, a coffee, a
colleague, a handshake, a hug, a lift. The adult bodies are ordinary and
nothing physical happens, but the lines are full of near-miss words: "cuts
through the crowd", "blood orange", "dying for a coffee", "sick of waiting",
"kills time".

No grounding card should fire, and the narrator should not start inventing
calluses, sweat and smells for people nobody is looking at. The first probe
over this scene caught three false positives, which led to the cards' `Unless`
lines and to the smell card needing a hard state:

- the fresh-blood card on "cuts through the crowd";
- the same card on "blood orange";
- the after-a-hard-night smell card on a friendly hug.

Graded by:

- the run's grounding summary: `expectNoGrounding`, so any card on any turn
  fails it ([LabTextRun](LabTextRun.md));
- [BodyDetailScore](BodyDetailScore.md), compared with a `--no-grounding` run.

## Methods

- `LabControlScenario.build()` -> `{ name: 'control', data, turns, facts: [],
  judges: [], expectNoGrounding: true }`.
- `data()`, `canned()`.
