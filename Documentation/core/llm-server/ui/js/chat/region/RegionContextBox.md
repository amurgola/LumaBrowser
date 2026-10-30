# RegionContextBox

`core/llm-server/ui/js/chat/region/RegionContextBox.js`

What the edit model will be given for a painted area, worked out in the
editor so the user sees it before sending: the padded close-up the main
process cuts around a small area, or the whole image when the area is large.
The arithmetic mirrors
[RegionCrop.box](../../../../../../image-server/region/RegionCrop.md) exactly;
a test holds the constants and the results of the two together.

## Methods (all static)

- `resolve({ bounds, width, height })`: `{ cropped: true, rect }` for a
  close-up, `{ cropped: false, rect: the whole image }` when the close-up
  would reach `FULL_SHARE` of the image, null when nothing is painted.
- `box({ bounds, width, height })`: the close-up rectangle or null, the same
  steps as `RegionCrop.box` (`PAD_SHARE` 0.6 of the painted box's longer side,
  at least `MIN_PAD_PX` 48, never under `MIN_SIDE` 512, square where the image
  allows, centred and clamped).
- `describe(context)`: "Edits a 512x512 close-up around the area" or "Edits
  the whole image".

## Why

The close-up decides how much detail the model can spend on the area and
whether the whole picture is re-rendered, and it used to be decided only after
Send. Showing the dashed box while painting lets the user keep the mask inside
it with a margin, which the crop-and-stitch tools recommend against seams, and
see when one more stroke tips the edit into a whole-image render.
