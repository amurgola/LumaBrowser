# GameSetupSchema

`extensions/game-mode/ui/GameSetupSchema.js`

The "New game" setup form, built on every open because its language-model
and image-model options come from what is installed.

## Methods

- `GameSetupSchema.fetchImageModels(api)`: `api.image.getModelsView()`
  models except `edit` and `video` kinds, as `{ value: id, label: displayName || id }`;
  `[]` on any failure.
- `GameSetupSchema.build(imageModels, llmOptions)`: `{ title: 'New game', subtitle,
  submitLabel: 'Start building', fields }`. Fields: `kind` (web / ai),
  `premise` (required), `worldNotes` (shown for AI games), `name`, `genre`,
  `artStyle`, `palette` (`''` "Let the image model pick", `pico-8`,
  `game-boy`, `sweetie-16`, `endesga-32`, or `custom`) and `paletteCustom`
  (a hex-colour textarea shown only for `custom`; see
  [GamePalettes](../assets/GamePalettes.md)); then `llmModel`, the
  "Language model" select that builds the game (options from
  [GameLanguageModel.choices](GameLanguageModel.md); with none given, only
  "Use current chat model"), which always shows; plus `spriteModel` and
  `backdropModel` selects (first option "Use image-server default") when any
  image model is installed.
- `GameSetupSchema.defaultPins(imageModels)`: `{ llmModel, spriteModel, backdropModel }`:
  `llmModel` is `''` (the current chat model), the image pins are
  the first installed id from `SPRITE_PREFERRED` (`rd-flow-64`,
  `chroma1-flash`, `chroma1-hd`) and `BACKDROP_PREFERRED` (`chroma1-hd`, `chroma1-flash`), else `''`.
  These mirror the main-process image-model pins; the bundle cannot require them.

## Globals

None.
