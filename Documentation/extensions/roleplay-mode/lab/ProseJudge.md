# ProseJudge

`extensions/roleplay-mode/lab/ProseJudge.js`

The optional judge pass: one completion scores the narrator's replies 0 to 10
on the EQ-Bench creative-writing criteria that matter for roleplay
(`believableActions`, `consistentVoice`, `elegantProse`, `emotionallyEngaging`,
`coherent`) and the faults (`tellDontShow`, `purpleProse`, `meandering`,
`weakDialogue`), as strict JSON with two sentences of notes.

## Methods

- `ProseJudge.messages(data, transcript)`, `request(data, transcript)`
  (temperature 0.2, 180 s, `noThink`; the transcript capped at 14000 chars).
- `ProseJudge.parse(text)` -> `{ scores, notes }` with each score clamped to
  0..10, or null.
