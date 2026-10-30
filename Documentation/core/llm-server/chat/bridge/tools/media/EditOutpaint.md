# EditOutpaint

`core/llm-server/chat/bridge/tools/media/EditOutpaint.js`

A reframe (`edit_image`'s tall, wide, portrait, landscape or square frame) run
as a true outpaint: the source is placed inside the new canvas and kept, and
the model fills only the new space around it. Mirrors
[EditRegion](EditRegion.md)'s contract so the handler swaps the picture, the
mask and the composite.

## Methods

- `EditOutpaint.prepare({ frame, canvas, srcBuf, anchor })`: null for a match
  frame, no canvas, a shape that adds no space, or no codec; else an instance
  over [OutpaintCanvas](../../../../../image-server/region/OutpaintCanvas.md)`.build`.
- `EditOutpaint.anchorOf(raw)`: center, top, bottom, left or right (default
  center). `ANCHORS`.
- `canvasDims`, `sides`, `anchor`.
- `sourceBytes()`, `sourceBase64()`: the padded canvas, sent as both the
  reference and the init image. `inpaintMask()`: white over the new space.
- `promptHint()`: "The picture has been extended with empty space on the left
  and the right; fill that new space by continuing the scene ... The original
  part of the picture stays exactly as it is." `EditOutpaint.where(sides)`.
- `finish(image)`: the render's new space over the kept source pixels through
  [RegionComposite](../../../../../image-server/region/RegionComposite.md)
  (`composited: true`), or the raw render.
- `summary(composited)`: the clause for the tool's result message.

## Why

Before this a reframe handed the source over as a reference and asked for a
new picture in the new shape, which let the subject move or change size. The
init-plus-mask path proven for region edits makes a real outpaint possible on
sd.cpp: the original pixels never move and the model paints only the
extension, which is how Fooocus, ComfyUI and Krita all do it.
