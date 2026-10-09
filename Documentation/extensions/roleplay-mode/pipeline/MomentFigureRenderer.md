# MomentFigureRenderer

`extensions/roleplay-mode/pipeline/MomentFigureRenderer.js`

Ensures the cached posed and emotive moment figure for a reaction.

## Methods

- `new MomentFigureRenderer(chat, { pause, bodies })`.
- `ensure(data, char, pose, emotion, baseBodyB64, { turn, abortSeq })`.
- `MomentFigureRenderer.cached(char, state, pose, emotion)`,
  `MomentFigureRenderer.cacheKey(char, pose, emotion)`.
