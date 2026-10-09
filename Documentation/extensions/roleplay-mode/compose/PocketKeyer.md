# PocketKeyer

`extensions/roleplay-mode/compose/PocketKeyer.js`

Keys small enclosed backdrop pockets on chroma backdrops only.

## Methods

- `PocketKeyer.key(job, opts)` mutates `job.keyed`: components of near-backdrop
  pixels (tight distance, or shaded chroma in the same colour direction) no
  larger than `pocketMaxFrac` (6%) of the figure are keyed.
