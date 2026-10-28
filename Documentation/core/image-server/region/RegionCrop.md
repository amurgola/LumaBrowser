# RegionCrop

`core/image-server/region/RegionCrop.js`

The close-up an edit of a small region runs on: a padded box around the
painted area, cut out of the source so the model spends its whole canvas on
the part that changes, and pasted back once the render is composited. Pure
bitmap arithmetic; the codec only decodes and encodes at the edges.

## Methods (all static)

- `box({ bounds, width, height })`: the close-up `{ x, y, width, height }`
  around the painted mask's tight box on a `width x height` image: padded by
  `PAD_SHARE` (0.6) of the box's longer side on every side (at least
  `MIN_PAD_PX`, 48), square where the image allows and never smaller than
  `MIN_SIDE` (512) on a side, centred on the box and clamped inside the image.
  Null when the close-up would cover `FULL_SHARE` (half) of the image or more,
  or without usable bounds: then the whole image is edited as before.
- `cut(bitmap, rect)`: the pixels of `rect` out of a 4-byte-per-pixel bitmap.
- `paste(bitmap, patch, rect)`: a copy of `bitmap` with `patch` written over
  `rect`.
- `cutPng({ sourceBytes, rect, codec = NativeBitmapCodec })`: the close-up as
  PNG bytes, or null when the source cannot be read, the rect runs past it, or
  the encode fails.

## Why

The one real quality lever for a small painted area. An edit model renders the
whole picture at its native canvas (about 1.3 to 1.7 MP), so a face that is 4%
of the image gets a 200-pixel square of that render and comes back soft; cut
out as a 512+ close-up and rendered at the native area (the edit handler asks
[EditCanvas](../../llm-server/chat/bridge/tools/media/EditCanvas.md) to `fill`)
it gets the whole canvas. Automatic1111's "inpaint only masked", ComfyUI's
crop-and-stitch nodes and Fooocus's inpaint all do the same. The padding keeps
enough of the surroundings for the model to match style, lighting and scale.
