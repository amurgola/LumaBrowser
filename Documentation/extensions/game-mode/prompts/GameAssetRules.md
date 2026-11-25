# GameAssetRules

`extensions/game-mode/prompts/GameAssetRules.js`

The `<assets>` prompt block, which changes with what the machine can do.

## Methods

- `GameAssetRules.render({ imageReady, artStyle, alpha, models, palette })`: timing (images generate vs placeholders ship), transparent-sprite vs opaque rules (`alpha`), the setup art style, and a sprite/backdrop model line only when the two pins differ.
  - When either pin is RD Flow 64 ([RdFlowAssets](../assets/RdFlowAssets.md)`.isModel`), a line says pixel-art sprites render on it, should stay square-ish at 64x64 or smaller (or 128/192/256 for whole-pixel zoom), and asks for each such sprite's prompt as one plain caption of 120 to 200 words in a fixed order with no "pixel art", "sprite", sizes or text: the model was trained on long plain captions only, and a short prompt draws a much weaker sprite.
  - With a locked `palette` (`['#rrggbb', ...]`), a line names its size and up to 32 of its colours and says every pixel-art asset is drawn in or snapped to it, so the agent describes colours it contains.
