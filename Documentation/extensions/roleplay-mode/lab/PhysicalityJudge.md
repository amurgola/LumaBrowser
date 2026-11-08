# PhysicalityJudge

`extensions/roleplay-mode/lab/PhysicalityJudge.js`

The body-realism judge a scenario opts into (`judges: ['physicality']`, run
when the text run has `judge` on). One completion reads the cast's bodies and
the transcript and scores the narrator 0 to 10 on `bodyConstraints`,
`physicalPlausibility`, `differentiation` and `embodiedDetail`, and the faults
`impossibleFeats`, `bodyAmnesia`, `stereotyping` and `clinicalVoice` (the last
catches textbook register leaking from grounding), plus up to 12 concrete
`slips` ("turn N: what happened and why it is wrong") and two sentences of
notes.

A same-model judge is generous: on the first Qwen3.8-27B run it scored 8 to 9
while the transcript had a man carrying an adult on his hip and the smallest
child chilling slowest. Read the slips and the transcript, not only the
numbers.

## Methods

- `PhysicalityJudge.messages(data, transcript)`, `request(data, transcript)`
  (temperature 0.2, 240 s, `noThink`; transcript capped at 26000 chars).
- `PhysicalityJudge.parse(text)` -> `{ scores, slips, notes }` or null.
