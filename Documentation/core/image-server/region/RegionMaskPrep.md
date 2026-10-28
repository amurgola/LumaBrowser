# RegionMaskPrep

`core/image-server/region/RegionMaskPrep.js`

Turns the mask a user painted into what an edit run needs: the mask at the
source's size, its grown binary form (as a PNG for an inpainting backend,
white is re-denoised), the feather the composite softens its edge with, and
the measures (coverage, bounds) that place the region.

## Methods (all static)

- `prepare({ maskPng, width, height, codec = NativeBitmapCodec })`: resizes
  the painted mask to the source's size, binarizes and grows it by `growPx`,
  encodes that as `inpaintPng`, and measures `coverage` and `bounds` on the
  painted mask. Returns `{ mask, grown, inpaintPng, featherPx, coverage,
  bounds }`, or null when the codec cannot read or write, the mask is empty,
  or a size is missing.
- `inpaintPng(grown, rect = null, codec)`: the grown mask, or the part of it
  inside `rect` (a [RegionCrop](RegionCrop.md) close-up), as the PNG an
  inpainting backend takes; null when the encode fails.
- `growPx(width, height)`: 2% of the longer side, 4..32 px.
- `featherPx(width, height)`: 1% of the longer side, 2..16 px.

## Why

stable-diffusion.cpp rounds its mask to binary and resizes it nearest-neighbour,
so the grow has to happen here. The feather is applied by
[RegionComposite](RegionComposite.md) rather than here, because the mask it
softens is only known once the render is back (it follows the model's changes
first, [RegionChangeSpread](RegionChangeSpread.md)).
