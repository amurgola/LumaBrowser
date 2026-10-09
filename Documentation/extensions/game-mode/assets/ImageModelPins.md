# ImageModelPins

`extensions/game-mode/assets/ImageModelPins.js`

Which image model renders which game asset. Sprites (transparent, or under 256 px long side) and backdrops want different models, so a conversation carries a sprite pin and a backdrop pin; a legacy single `imageModel` pin is both.

## Methods

- `SPRITE_PREFERRED` `[chroma1-flash, chroma1-hd]`, `BACKDROP_PREFERRED` `[chroma1-hd, chroma1-flash]` (chat-ui.js mirrors them for setup defaults), `SPRITE_MAX_SIDE` 256.
- `resolve(meta.data)` -> `{ sprite, backdrop }` from `spriteModel`/`backdropModel`, else `imageModel`.
- `normalize(ref)` a string, null or a pins object -> `{ sprite, backdrop }`.
- `roleOf({ width, height, transparent })` `sprite` | `backdrop`.
- `modelFor(asset, pins)` the pin for the asset's role, falling back to the other half; undefined means the image-server default.
- `orderSpecs(specs, pins)` stable sort making each model contiguous (sprite model first): the server reloads on every model switch.
- `defaults(installedIds)` setup-form defaults `{ spriteModel, backdropModel }` (`''` when none preferred is installed).
