# ProseCues

`extensions/roleplay-mode/prompts/ProseCues.js`

Cheap regex reads of an assistant turn's prose.

## Methods

- `ProseCues.shotType(content)` `'full'` for action and pose beats, else `'portrait'`.
- `ProseCues.isSeated(content)`.
- `ProseCues.movementHint(content)` and `ProseCues.outfitHint(content)` gate the
  stage call when auto images are off.
