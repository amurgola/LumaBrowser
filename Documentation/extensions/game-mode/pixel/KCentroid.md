# KCentroid

`extensions/game-mode/pixel/KCentroid.js`

K-Centroid downscale: one output pixel per source cell, coloured by the dominant k=2 k-means centroid (seeded from the darkest and lightest pixels, deterministic). Mostly transparent cells stay transparent and transparent pixels never vote.

## Methods

- `KCentroid.downscale(src, sw, sh, outW, outH)` RGBA of outW x outH.
