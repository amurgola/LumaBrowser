# BodyDetailScore

`extensions/roleplay-mode/lab/BodyDetailScore.js`

How densely the narrator writes about bodies: hits from a lexicon of
body-detail words (sweat, smell, skin, blood, calluses, veins, breath and the
like) per hundred words of narration, per reply and overall. It needs no
judge, so it is cheap and comparable between runs. Every text run reports it.

Compare a run with a `--no-grounding` run. On the control scenario
([LabControlScenario](LabControlScenario.md)) it should stay low and close to
the ungrounded run; on the body scenarios it should rise where the moment
calls for it.

## Methods

- `BodyDetailScore.run({ transcript })` -> `{ perHundred, hits, words,
  replies: [{ turn, hits, perHundred, found }] }`.
