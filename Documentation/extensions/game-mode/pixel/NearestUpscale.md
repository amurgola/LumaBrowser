# NearestUpscale

`extensions/game-mode/pixel/NearestUpscale.js`

Nearest-neighbour upscale: every logical pixel becomes a solid block, so a big pixel-art asset ships chunky. Non-integer ratios fill the output; alpha is copied.

## Methods

- `NearestUpscale.apply(src, sw, sh, outW, outH)`.
