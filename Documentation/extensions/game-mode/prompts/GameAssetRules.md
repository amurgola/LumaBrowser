# GameAssetRules

`extensions/game-mode/prompts/GameAssetRules.js`

The `<assets>` prompt block, which changes with what the machine can do.

## Methods

- `GameAssetRules.render({ imageReady, artStyle, alpha, models })`: timing (images generate vs placeholders ship), transparent-sprite vs opaque rules (`alpha`), the setup art style, and a sprite/backdrop model line only when the two pins differ.
