# BorderClusters

`extensions/roleplay-mode/compose/BorderClusters.js`

Finds a render's backdrop colours by clustering its border ring.

## Methods

- `BorderClusters.find(d, W, H)` up to three `{ r, g, b, frac, edges }` covering
  at least 6% of the ring and touching two edges.
- `BorderClusters.isGreenDominant(r, g, b)`.
