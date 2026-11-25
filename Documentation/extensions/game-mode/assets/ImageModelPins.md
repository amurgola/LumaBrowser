# ImageModelPins

`extensions/game-mode/assets/ImageModelPins.js`

Which image model renders which game asset. Sprites (transparent, or under 256 px long side) and backdrops want different models, so a conversation carries a sprite pin and a backdrop pin; a legacy single `imageModel` pin is both.

## Methods

- `SPRITE_PREFERRED` `[rd-flow-64, chroma1-flash, chroma1-hd]`, `BACKDROP_PREFERRED` `[chroma1-hd, chroma1-flash]` ([ui/GameSetupSchema](../ui/GameSetupSchema.md) mirrors them for setup defaults), `SPRITE_MAX_SIDE` 256. RD Flow 64 leads the sprite list because the 2026-11-25 bake-off had it beat Chroma1-Flash plus the pixel post-chain on 64x64 sprites (clean outlines, real transparency, no keying misses); it draws pixel art only, so other assets fall to the other pin.
- `resolve(meta.data)` -> `{ sprite, backdrop }` from `spriteModel`/`backdropModel`, else `imageModel`.
- `normalize(ref)` a string, null or a pins object -> `{ sprite, backdrop }`.
- `describe(params, artStyle)` -> `{ width, height, transparent, pixel, gridW, gridH }`, what routing needs to know about one asset request: clamped output dims, whether it is pixel-art (the request's style, else the setup default, and the canvas post-chain available) and its logical pixel grid.
- `roleOf({ width, height, transparent })` `sprite` | `backdrop`.
- `modelFor(asset, pins)` (`asset` from `describe`) the pin for the asset's role, falling back to the other half, also when the role's pin is RD Flow 64 and [RdFlowAssets](RdFlowAssets.md)`.canDraw` says it cannot draw the asset (not pixel-art, or a grid it cannot reach); undefined means the image-server default.
- `orderSpecs(specs, pins)` stable sort making each model contiguous (sprite model first): the server reloads on every model switch.
- `defaults(installedIds)` setup-form defaults `{ spriteModel, backdropModel }` (`''` when none preferred is installed).
