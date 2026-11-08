# LabBodyScenario

`extensions/roleplay-mode/lab/LabBodyScenario.js`

The Lab's body-variation text playthrough (`npm run rp:text -- --scenario
body`): a night flood in a mill house with a physically mixed household (Edda,
78, arthritic hands and cataracts, with a cane; Bram, 201 cm and 140 kg with
bad knees; Pip, nine; Sela, eight months pregnant; Joss, a T10 paraplegic in a
manual wheelchair). Ten player turns each ask a body to do something: the
stairs, a carry, a ceiling hatch, darkness, an hour of cold, a small window
over a boat, the boat, the shelter.

## Methods

- `LabBodyScenario.build()` -> `{ name: 'body', data, turns, facts, judges:
  ['physicality'] }`; the facts check that the wheelchair, the pregnancy and
  the hands are still in context and recalled when asked.
- `data()`, `canned()` (mocked side calls keep the household on stage).
