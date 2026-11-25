# AssetPostChain

`extensions/game-mode/assets/AssetPostChain.js`

Turns a freshly generated image into the asset file: pixel-art K-Centroids to its grid (snapped to the game palette when there is one, see [GamePalettes](GamePalettes.md)) and back up to the layout size; RD Flow 64's finished palette art is resized pixel-exactly; other styles smooth-downscale; transparent assets key their background on the way.

## Methods

- `apply(buf, job)` -> `{ buf, keyed }`; `keyed` is null unless transparency was asked, then whether keying actually landed. A failed step keeps the generated image.
- An RD Flow 64 job (`job.rdFlow`) goes through [PixelPost](../pixel/PixelPost.md) `paletteArtResize` to its grid and layout size with no keying: the model drew real transparency itself, so `keyed` is `true` when transparency was asked, else null.
