# ImageQuantResolver

`core/image-server/ipc/ImageQuantResolver.js`

Applies an optional diffusion-quant choice to a catalog entry's files bag.

## Methods

- `ImageQuantResolver.resolve(entry, quantId)` returns `{ files }` (a copy of `entry.files` with `diffusion.quants` removed and, when a quant is chosen, the diffusion `file`, `url`, `approxBytes` swapped) or `{ error: 'Unknown quant "<q>" for model "<id>".' }`. No quant, or a model without a ladder, keeps the catalog default.

## Why

The manifest only records the concrete file that was downloaded.
