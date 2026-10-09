# PoseCatalog

`extensions/roleplay-mode/prompts/PoseCatalog.js`

Body poses for the composited reaction figure and the body-language cue each
emotion adds.

## Methods

- `PoseCatalog.resolve(shot, content)` director pose, else prose pose.
- `PoseCatalog.fromProse(content)` / `fromDirector(shot)` (null without a pose)
  return a copy of `{ key, variant, figH }`.
- `PoseCatalog.bodyCue(emotion)` the gesture text or null.
