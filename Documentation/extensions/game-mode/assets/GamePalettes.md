# GamePalettes

`extensions/game-mode/assets/GamePalettes.js`

The game's locked colour palette from its setup: a named preset or the user's own colours. Palette-pointer models (RD Flow 64) draw with it directly; other models' pixel art is snapped to it, so a whole game's art matches.

## Methods

- `PRESETS`: `pico-8` (16), `game-boy` (4 greens), `sweetie-16` (16), `endesga-32` (32), as hex without `#`. `MAX_COLOURS` 256.
- `resolve(data)` from the conversation's setup (`palette`: a preset id, `custom` with `paletteCustom`, or `''`) -> `['#rrggbb', ...]`, or null when the image model may choose its own colours (no choice, an unknown id, or a custom text with no colour in it).
- `parse(text)` any text holding colours (`#1a1c2c, 5d275d ...`, a pasted Lospec `.hex` or paint.net file) -> unique `['#rrggbb', ...]` (at most `MAX_COLOURS`, `#` optional, lowercased) or null. Three digits expand to six; eight digits are AARRGGBB (paint.net) when they start with `ff`, else RRGGBBAA, and the alpha is dropped; any other token is not a colour.
- `toRgb(palette)` `['#rrggbb', ...]` -> `[[r, g, b], ...]`, the form [PixelPost](../pixel/PixelPost.md) and [PaletteQuantizer](../pixel/PaletteQuantizer.md) take.

## Used by

- [GameTurnBuilder](../mode/GameTurnBuilder.md) and [GameAiSurface](../mode/GameAiSurface.md) resolve it for the asset tools and play-time images; [GameSystemPrompt](../prompts/GameSystemPrompt.md) for the palette line of [GameAssetRules](../prompts/GameAssetRules.md).
- [AssetPostChain](AssetPostChain.md) converts it with `toRgb` for the pixel-art snap; an RD Flow 64 request sends it as `palette` ([AssetJob](AssetJob.md)).
- The setup fields are in [mode/GameSetupSchema](../mode/GameSetupSchema.md) and [ui/GameSetupSchema](../ui/GameSetupSchema.md).
