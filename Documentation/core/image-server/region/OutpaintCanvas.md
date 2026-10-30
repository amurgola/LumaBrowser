# OutpaintCanvas

`core/image-server/region/OutpaintCanvas.js`

The padded picture an outpaint (a reframe to a wider or taller shape) is
rendered on: the source fitted inside the target canvas at an anchor, the new
space filled by replicating the source's edge pixels, and a mask that is white
over the new space, grown a little into the source so the seam is re-denoised
too. Pure bitmap arithmetic; the codec only decodes, resizes and encodes.

## Methods (all static)

- `build({ sourceBytes, width, height, anchor = 'center', codec })`:
  `{ png, maskPng, grown, featherPx, placed, sides }` or null when the shape
  adds no space (`MIN_PAD_PX`, 8, on both axes) or the codec cannot read or
  write. `grown` is the mask dilated by
  [RegionMaskPrep](RegionMaskPrep.md)`.growPx`; `featherPx` its feather;
  `placed` the source's `{ x, y, width, height }` on the canvas.
- `place({ sw, sh, width, height, anchor })`: scale to fit entirely, then
  anchor (`ANCHORS`: center, top, bottom, left, right; unknown is centre).
- `pad(fitted, placed, width, height)`: every pixel outside the placed source
  is its nearest edge pixel.
- `mask(placed, width, height)`: 255 outside the placed source.
- `sides(placed, width, height)`: which of left, top, right, bottom got at
  least `MIN_PAD_PX` of new space, in that order.

## Why

Every tool surveyed outpaints the same way: Fooocus pads with `np.pad(mode=
'edge')` and masks the new area at strength 1, ComfyUI's ImagePadForOutpaint
does the same with a feather, Krita pre-fills from the border. The edge
replication gives the denoiser a colour and tone to continue instead of grey,
and the grown mask lets it redraw the seam so the join does not show.
