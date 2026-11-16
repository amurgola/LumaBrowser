# EditRegion

`core/llm-server/chat/bridge/tools/media/EditRegion.js`

The user-painted region one `edit_image` call confines itself to: which region
applies, its masks against the source, the close-up a small region is edited
on, the wording for a mask-less edit model, and the composite that restores
the source outside the region once the render is back.

## Methods

- `EditRegion.resolve({ params, artifactId, index })`: a region painted on
  this exact image in the message being answered (`index.currentFor(artifactId)`)
  always applies, whatever `params.regionId` says: the user drew it by hand for
  this request, and the chat model, which sees only the region's share of the
  picture, used to drop it with `"none"` when a small figure was painted whole
  (5 of 8 masked turns in the edit-framing e2e run of 2026-11-15). Without
  such a region `params.regionId` may name one from an earlier message (an
  unknown id, or one marked on another image, is an `error` the model can act
  on), and `"none"`, `false`, `null` or nothing mean the whole image. Returns
  `{ region }` or `{ error }`.
- `EditRegion.prepare({ region, srcBuf, srcDims })`: runs
  [RegionMaskPrep](../../../../../image-server/region/RegionMaskPrep.md)
  against the source's header size (else the size the region was painted at),
  then asks [RegionCrop](../../../../../image-server/region/RegionCrop.md) for
  the close-up box around the painted bounds and cuts it out of the source
  (`cutPng`). No box (a large area) or no cut (no codec): the whole source is
  edited.
- `id`, `note`, `coverage` (measured on the source, else the row's),
  `composites` (a codec was available), `cropped`, `cropRect`, `canvasDims`
  (the close-up's size, else the source's: what the canvas is matched to).
- `sourceBytes()`, `sourceBase64()`: the picture the model is given, the
  close-up or the source.
- `inpaintMask()`: the grown binary PNG (the close-up's part of it when
  cropped), else the painted PNG as sent.
- `promptHint()`: [RegionPromptHint](../../../../../image-server/prompt/RegionPromptHint.md)
  for the picture the model sees: bounds and share relative to the close-up
  when there is one.
- `finish(image)`: `{ ...image, bytes, mime, width, height, composited: true }`
  through [RegionComposite](../../../../../image-server/region/RegionComposite.md)
  (with the grown mask, the feather and the crop rect), or the raw image with
  `composited: false`.
- `summary(composited, { held })`: the clause for the tool's result message;
  names the close-up's size when one was used and, with `held`, that the edit
  model was kept to the area by its mask while rendering.

## Why

Every edit route gets the same contract from one object: img2img gets a real
inpaint mask, an edit model gets the location in words and the same mask on an
init image (the handler sends `sourceBytes()` as both reference and init with
`inpaintMask()` at full strength), and both get the pixel composite, so "only
this area changes" holds whichever model is configured. The
close-up lives here too, so the handler only swaps the picture, the canvas
size and the mask it sends, and the composite puts the result back where it
came from.
