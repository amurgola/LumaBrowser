# RegionComposite

`core/image-server/region/RegionComposite.js`

Puts an edited render back onto its source: only the marked region takes the
new pixels, everything else is the original byte for byte. The render is
resized to the area it was made for (the whole source, or the close-up `rect`
cut from it) and the blend follows the model's drift next to the painted area
before it is feathered.

## Methods (all static)

- `apply({ sourceBytes, outputBytes, grown, featherPx = 0, rect = null, codec
  = NativeBitmapCodec })`: `grown` is [RegionMaskPrep](RegionMaskPrep.md)'s
  grown binary mask at the source's size and `featherPx` its feather; `rect`
  the [RegionCrop](RegionCrop.md) close-up the render was made on, if any.
  Decodes both, cuts the source and the mask to the rect, resizes the render
  to that area, builds the blend (`followed`, then
  `EditRegionMask.feather`), composites, pastes the patch back over the rect
  and encodes. Returns `{ bytes, mime: 'image/png', width, height }` (always
  the source's size), or null when a decode, the resize or the encode fails,
  the mask is not the source's size, or the rect runs past the source (the
  caller then keeps the raw render).
- `followed(area, output, mask)`: the mask plus the strongly changed pixels
  connected to it, within [RegionChangeSpread](RegionChangeSpread.md)'s cap
  for the area's size.

## Why

Qwen-Image-Edit, FLUX Kontext and the other instruction editors take no mask and
drift outside the asked-for change; even an inpainting run blends in latent
space and can shift pixels it should keep. Compositing in pixel space is what
makes "the rest is kept" true. Following the model's changes next to the area
is what keeps the seam from showing both the old and the new drawing when the
model moved the object a little.
