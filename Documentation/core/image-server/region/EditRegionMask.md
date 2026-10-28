# EditRegionMask

`core/image-server/region/EditRegionMask.js`

Pure raster operations on an edit region mask: `{ width, height, data }` with
one byte per pixel, 255 where the user wants change and 0 where the picture is
kept. Soft values are allowed; each backend gets the form it needs.

## Methods (all static)

- `fromBitmap({ width, height, data })`: a decoded 4-bytes-per-pixel bitmap
  painted white on black; the first channel is the level (channel order does
  not matter for a grey image).
- `blank(width, height, value = 0)`.
- `coverage(mask)`: the marked share, 0..1, soft pixels by their level.
- `isEmpty(mask)`: nothing at or above `EDIT_THRESHOLD` (128).
- `bounds(mask)`: `{ x, y, width, height }` around the pixels at or above the
  threshold, or null.
- `binarize(mask)`: 0 or 255 at the threshold.
- `dilate(mask, radius)`: grows the marked area by `radius` pixels in every
  direction (a separable max filter), so the model has room to blend.
- `feather(mask, radius)`: two passes of a separable box blur, a gaussian-like
  ramp of about twice the radius at the edge.
- `resize(mask, width, height)`: bilinear, so soft edges survive.
- `crop(mask, rect)`: the part inside `{ x, y, width, height }`, clipped to the
  mask (a [RegionCrop](RegionCrop.md) close-up's share of it).
- `toBitmap(mask)`: an opaque grey 4-byte bitmap for a PNG encoder.
- `composite({ source, output, mask })`: the output inside the mask over the
  source outside it, blended by level, alpha forced to 255. All three must
  share one size (throws otherwise).

## Why

The leaders all grow then soften a painted mask before use (Stability's
`grow_mask`, ComfyUI's `grow_mask_by`, A1111's mask blur, Photoshop's feather),
and composite the result back because models drift outside the mask. One
internal 8-bit plane makes both cheap and backend-independent.
