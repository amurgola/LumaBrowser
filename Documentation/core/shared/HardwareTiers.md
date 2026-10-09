# HardwareTiers

`core/shared/HardwareTiers.js`

Classifies a machine into one of the three plain-English rows in
[hardwareTiers.json](hardwareTiers.json.md) (`laptop`, `gaming`, `highend`).
Pure, no I/O.

## Methods

- `HardwareTiers.classify(hw)` takes the `buildHwBudget()` shape (`gpus[{ totalBytes | maxBytes }]`,
  `vramTotalBytes`, `usableVramBytes`, `ramTotalBytes`, optional `unifiedMemory`) and returns
  `{ id, name, yourMachine, whatYouGet, speedFeel, downloadGiB, diskFreeGiB, largestCardGiB }`.
  Never throws; an empty report is the first row.
- `HardwareTiers.minGpuBytes()` is the json `minGpuGiB` floor in bytes (1.5 GiB if missing). A card at or below it counts as no GPU.
- `HardwareTiers.TIERS` is the parsed json.

## Rules

- Classification uses the largest single card, because that is what one model can use; cards do not add up.
- Card size is `totalBytes`, else `maxBytes`. With no card list, `vramTotalBytes` then `usableVramBytes` stand in.
- With `unifiedMemory`, the row is picked by `ramTotalBytes` against the `unifiedMemory*GiB` bounds instead.
- Bounds are `min <= value < max`; the first matching row wins, else the first row.
