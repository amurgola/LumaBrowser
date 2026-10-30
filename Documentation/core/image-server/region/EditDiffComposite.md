# EditDiffComposite

`core/image-server/region/EditDiffComposite.js`

Keeps a whole-image edit honest: an instruction edit model returns a new frame
in which the untouched parts are close to the source but not identical (a
slight colour shift, a resample, softening that compounds over a chain of
edits). The render is compared with the source, the strongly changed area is
cleaned of specks, grown and feathered, and only that area is taken from the
render; everything else is the source byte for byte. A change covering most of
the picture is a global edit and the full render is kept.

## Methods (all static)

- `apply({ sourceBytes, outputBytes, codec })`: `{ bytes, mime, width,
  height, share, global, composited }` or null when either image cannot be
  read. Works at the larger of the two sizes, so a small source scaled up
  into the model's working size keeps the enlargement. `share` is the changed
  share of the picture after cleaning; at `GLOBAL_SHARE` (0.35) or above the
  render is returned as sent (`global: true`, the original bytes when no
  resize was needed). Otherwise the changed area (per-channel difference over
  `THRESHOLD`, 40, opened by `SPECKLE_PX`, 1) is grown by
  [RegionMaskPrep](RegionMaskPrep.md)`.growPx`, feathered by `featherPx`, and
  the render is blended in only there.
- `open(mask, r)`: morphological opening (erode, then dilate); `invert(mask)`.

## Why

The research consensus (BFL's own note that unchanged pixels are "not
guaranteed", the ComfyUI diff-mask composite nodes, the measured 19% of
out-of-face pixels changed by a stock Qwen edit) is that the only pixel
guarantee is compositing. Doing it after every whole-image edit stops colour
drift and the decay of long edit chains, and keeps an attached photo's exact
pixel size. The caller opts out for a deliberate subtle change to the whole
picture, which this step would otherwise undo.
