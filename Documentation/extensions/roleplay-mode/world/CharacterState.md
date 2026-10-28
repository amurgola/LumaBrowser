# CharacterState

`extensions/roleplay-mode/world/CharacterState.js`

A character's state right now, overwritten by every stage call:
`char.state = { present, sceneId, emotion, intent, posture, bondUser, bondNote,
condition, lastSeen: { turn, sceneId, note } | null }`. Wardrobe stays on the
row and in `data.currentState` for the image pipeline.

## Methods

- `CharacterState.of(char)` never null.
- `arrive(char, sceneId, reading)` marks present with this moment's readings;
  blank `intent`, `bondUser`, `bondNote` and an omitted `condition` keep the
  previous value, so a stage reply that says nothing does not wipe what the
  last one established. `emotion` and `posture` are per moment.
- `depart(char, { turn, sceneId, note })` marks absent and records where they
  were last seen and why they left.
- `line(char)` the one-line "now" for the narrator; `absentLine(char, sceneName)`
  the off-stage line.
