# BackgroundKeyer

`extensions/game-mode/pixel/BackgroundKeyer.js`

Keys out a near-uniform, border-connected background in place. The background colour is sampled from the border (not assumed green); a BFS flood joins a pixel only when it is near the background globally and near its neighbour locally, then a defringe pass and a tight colour-only pass for enclosed pockets.

## Methods

- `BackgroundKeyer.key(rgba, w, h, { tolerance = 90, localTolerance = 34, minBorderMatch = 0.6 })` -> `{ cleared, fraction, bg }`, or null (image too small, busy border, or a fill eating over 95%, after which alpha is restored).
