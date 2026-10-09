# RefSizePlanner

`core/image-server/RefSizePlanner.js`

Plans the encode size of each reference image of an edit, for edit models that
encode every reference at the size it arrives.

## Methods

- `RefSizePlanner.plan({ dims, canvas, refArea?, grid = 32 })` returns one
  `{ width, height }` (or `null` to leave it) per entry of `dims`. The first
  reference is the source and takes the canvas area; the rest take `refArea`
  (capped at the canvas area, and the canvas area when unset) but never more
  than their own pixels. Each keeps its aspect and lands on the grid. A grid of
  1 or less falls back to 32; an unusable canvas plans every entry `null`.
- `RefSizePlanner.sizeAtArea(srcW, srcH, area, grid)` is the nearest grid size
  for an aspect at about `area` pixels, never below one cell.
- `RefSizePlanner.DEFAULT_GRID` is 32.

## Why

Left alone, the runtime resizes every reference to the full canvas area, so a
face and a garment each cost as many tokens as the picture being edited.
Tokens ride the whole denoise as a prefix (time and VRAM) and are prepared on
the CPU per megapixel. Sizing them here and sending `resize_before_vae=false`
lets the source keep the canvas while supporting references take less.
Enlarging a small reference gains no detail, only tokens.
