# AssetStyle

`extensions/game-mode/assets/AssetStyle.js`

Art styles for generated assets: coerces the style string a model passes onto `pixel-art`, `cartoon`, `painted`, `flat`, and builds the image prompt.

## Methods

- `normalize(raw)` exact match, then keyword mapping in priority order (`flat vector cartoon` is flat), else null.
- `prompt(subject, style, transparent)` `<style prefix>, <subject>, <background>`; transparent assets ask for one subject on a flat green screen with no shadow, which the keyer handles best.
- `noteFor(raw, coerced)` the result note when a style was coerced or ignored, `''` for exact ones.
- `isKnown(style)`, `PREFIX`.
