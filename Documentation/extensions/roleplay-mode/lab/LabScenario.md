# LabScenario

`extensions/roleplay-mode/lab/LabScenario.js`

The Lab's seeded scenario: the most recent saved roleplay, or a synthetic fallback.

## Methods

- `new LabScenario({ imageDefaults, chatStore })`; `current()`, `fallback()`.
  A saved roleplay (first 50 conversations, mode `roleplay`, a named first
  character) is deep-copied, its models filled from the image defaults, outfits
  cleared, state reset to the first character, options defaulted, `_real: true`.
