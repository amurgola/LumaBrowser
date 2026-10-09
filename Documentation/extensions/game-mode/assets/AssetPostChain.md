# AssetPostChain

`extensions/game-mode/assets/AssetPostChain.js`

Turns a freshly generated image into the asset file: pixel-art K-Centroids to its grid and back up to the layout size; other styles smooth-downscale; transparent assets key their background on the way.

## Methods

- `apply(buf, job)` -> `{ buf, keyed }`; `keyed` is null unless transparency was asked, then whether keying actually landed. A failed step keeps the generated image.
