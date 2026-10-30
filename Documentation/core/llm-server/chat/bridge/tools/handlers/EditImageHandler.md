# EditImageHandler

`core/llm-server/chat/bridge/tools/handlers/EditImageHandler.js`

`edit_image`: edits an image artifact and saves the next version of its chain.
A [ChatToolHandler](ChatToolHandler.md). A region the user painted confines
the edit ([EditRegion](../media/EditRegion.md)).

## Methods

- `execute(_, params, ctx)`: validates the image router, `prompt`, artifact id
  and source (found, an image, with bytes); resolves an
  [EditModelChoice](../media/EditModelChoice.md), the references
  ([EditReferences](../media/EditReferences.md), capped by the family), the
  canvas ([EditCanvas](../media/EditCanvas.md)) and the strength (0..1, default
  0.8). The request: remote editor -> reference edit on slot `edit`; edit model
  -> its `modelRef` on slot `edit`; unified model -> reference edit on slot
  `generate`; otherwise img2img (`initImage`, `strength`) on slot `generate`.
  Extra references follow the source with `EditProfiles.referencePreamble` in
  the family's tag style. Failures through
  [MediaRenderOutcome](../media/MediaRenderOutcome.md) (with the stderr tail).
  Success: `createVersion` and a message naming version, id, canvas, frame,
  references used, dropped or ignored.
- Regions: `regionId` (or the region painted on this image in the message
  being answered) resolves through `EditRegion.resolve` (an unknown id or one
  on another image is an error). With a region the frame is forced to `match`
  (a requested reshape is reported ignored), the img2img fallback gets the
  grown inpaint `mask`, and an edit model (local, unified or remote) gets the
  region two ways at once: the hint appended to its prompt, and the same
  picture riding again as `initImage` with the grown `mask` at
  `REGION_EDIT_STRENGTH` (1.0), which holds the model to the painted area in
  latent space (sd.cpp masks any model's denoise; measured on Qwen-Image 2.1,
  a reference-only run redrew the object larger and elsewhere, the held run
  kept it in place). The render goes through `region.finish` before
  `createVersion`, so the saved version is the source with only the painted
  area changed when a bitmap codec is available. A small region is edited on
  its close-up ([RegionCrop](../../../../../image-server/region/RegionCrop.md)):
  the picture sent (`refImages[0]` and `initImage`) is `region.sourceBytes()`,
  the mask the close-up's part, and the canvas is matched to
  `region.canvasDims` with `fill`, so the model's whole native area goes to
  the detail; the composite pastes the result back. The message carries
  `region.summary`, with `held` for an edit-capable choice.
- Region steps: a region edit asks for `choice.regionSteps` when the family
  documents fewer steps for localized edits (Qwen-Image 2.1 base: 12); the
  message says so.
- Reframes: a frame other than `match` on an edit-capable choice runs as an
  outpaint ([EditOutpaint](../media/EditOutpaint.md)): the source is fitted
  into the frame's canvas at `anchor` (center, top, bottom, left, right), the
  padded canvas rides as reference and init image with the new space masked at
  `REGION_EDIT_STRENGTH`, the prompt gets the outpaint hint, and `finish`
  composites the render into the new space only. With no codec or no new
  space the plain reframe runs as before; the img2img fallback still ignores
  frames.
- Kept pixels: a whole-image edit on an edit-capable choice (no region, no
  outpaint) goes through
  [EditDiffComposite](../../../../../image-server/region/EditDiffComposite.md)
  unless `keepUnchanged: false` is passed: the source is restored wherever the
  render did not visibly change, and the message says how much changed, or
  that the change was whole-picture and the render was kept.
- `NO_SERVER`, `NO_ARTIFACT`, `DEFAULT_STRENGTH`, `REGION_EDIT_STRENGTH`.
