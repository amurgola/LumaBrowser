# hardwareTiers.json

`core/shared/hardwareTiers.json`

Data file: the three plain-English hardware rows (`laptop`, `gaming`,
`highend`) plus `minGpuGiB`, shared by the automatic planner's classifier and
the website's "Will it run on my PC" table.

## Shape

- `minGpuGiB` is the floor below which there is no usable GPU.
- `tiers[]` rows carry `id`, `name`, `match` (boundaries in GiB, e.g.
  `maxVramGiB`, `unifiedMemoryMaxGiB`), `yourMachine`, `whatYouGet`,
  `speedFeel`, `modelSizeGiB`, `downloadGiB`, `diskFreeGiB`.

## Why

One source, no drift: the site's build copies this exact file, so edit it here
only and keep the copy free of em-dashes (it is user-facing). The classifier
that reads it is [HardwareTiers](HardwareTiers.md).
