# RevealJudge

`extensions/roleplay-mode/lab/RevealJudge.js`

The judge for [LabRevealScenario](LabRevealScenario.md). One completion lists
every new physical detail the narrator stated on the reveal turns (`reveals`:
turn, who, detail, two or three keywords from the narrator's own words), pairs
each recall-turn mention with the original (`recalls`: matches or drifts), and
scores `specificity`, `bodyFit`, `sensoryRange` and `continuity`, with the
faults `contradiction`, `genericDetail`, `clinicalVoice` and `lingering`.

## Methods

- `RevealJudge.messages(data, transcript, { revealTurns, recallTurns })`,
  `request(...)` (temperature 0.2, 240 s, `noThink`; transcript capped at
  30000 chars).
- `RevealJudge.parse(text)` -> `{ scores, reveals, recalls, notes }` or null.
- `RevealJudge.retention(reveals, { memory, inHistory })` -> `{ items, total,
  kept, inHistory, inMemory, memoryOnly }`. A reveal is `inHistory` when the
  reply that made it was still in the trimmed history, `inMemory` when one of
  its keywords is in the story's memory: the system head with the grounding
  layers cut out (their card text would match almost any reveal's keywords; the
  first version of this check counted that as memory) plus the scene notes. The
  text run builds both per recall turn (`LabTextRun._recallContext`), never
  counting that turn's own player line.
