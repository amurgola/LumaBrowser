# GameSetupSchema

`extensions/game-mode/ui/GameSetupSchema.js`

The "New game" setup form, built on every open because its image-model
options come from the installed models.

## Methods

- `GameSetupSchema.fetchImageModels(api)`: `api.image.getModelsView()`
  models except `edit` and `video` kinds, as `{ value: id, label: displayName || id }`;
  `[]` on any failure.
- `GameSetupSchema.build(imageModels)`: `{ title: 'New game', subtitle,
  submitLabel: 'Start building', fields }`. Fields: `kind` (web / ai),
  `premise` (required), `worldNotes` (shown for AI games), `name`, `genre`,
  `artStyle`; plus `spriteModel` and `backdropModel` selects (first option
  "Use image-server default") when any image model is installed.
- `GameSetupSchema.defaultPins(imageModels)`: `{ spriteModel, backdropModel }`,
  the first installed id from `SPRITE_PREFERRED` (`chroma1-flash`,
  `chroma1-hd`) and `BACKDROP_PREFERRED` (`chroma1-hd`, `chroma1-flash`), else `''`.
  These mirror the main-process image-model pins; the bundle cannot require them.

## Globals

None.
