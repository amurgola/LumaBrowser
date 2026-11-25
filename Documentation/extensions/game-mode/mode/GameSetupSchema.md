# GameSetupSchema

`extensions/game-mode/mode/GameSetupSchema.js`

The "New game" setup form: game type (web or AI), premise (required), world notes (AI games only), name, genre and colour palette.

`palette` is a select: `''` (let the image model pick), the presets `pico-8`, `game-boy`, `sweetie-16`, `endesga-32`, or `custom`, which shows the `paletteCustom` textarea (hex colours with any separator; a pasted Lospec `.hex` file works). [GamePalettes](../assets/GamePalettes.md) resolves the choice; pixel art is drawn in or snapped to it, so every asset matches.

## Methods

- `GameSetupSchema.build()`, `GENRES`.
