# LabRevealScenario

`extensions/roleplay-mode/lab/LabRevealScenario.js`

The Lab's reveal playthrough (`npm run rp:text -- --scenario reveal`): the
flood household from [LabBodyScenario](LabBodyScenario.md), already
established, the morning after at a gym shelter, soaked. Turns 1 to 6 take
boots, socks, slippers and stockings off and look at hands, so the narrator
has to invent physical detail no card holds yet (shape, skin, texture,
temperature, marks, smell) that fits each body and the night it had. Turns 7
to 9 are filler that, with the run's small window (`CONTEXT_WINDOW` 8192, so
the trimmed history keeps only a few turns), push the reveals out of the raw
history. Turns 10 to 12 bring the same feet, legs and ankles back to a medic,
so a detail that was never remembered shows up as drift.

Graded by [RevealJudge](RevealJudge.md); the run also checks, per recall turn,
which reveals were still in the narrator's context.

## Methods

- `LabRevealScenario.build()` -> `{ name: 'reveal', data, turns, facts,
  judges: ['reveal'], contextWindow, revealTurns, recallTurns }`.
- `data()`, `canned()`.
