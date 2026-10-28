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
  grown inpaint `mask`, an edit model's prompt gets the region hint appended,
  and the render goes through `region.finish` before `createVersion`, so the
  saved version is the source with only the painted area changed when a bitmap
  codec is available. A small region is edited on its close-up
  ([RegionCrop](../../../../../image-server/region/RegionCrop.md)): the
  picture sent (`refImages[0]` or `initImage`) is `region.sourceBytes()`, the
  mask the close-up's part, and the canvas is matched to `region.canvasDims`
  with `fill`, so the model's whole native area goes to the detail; the
  composite pastes the result back. The message carries `region.summary`.
- `NO_SERVER`, `NO_ARTIFACT`, `DEFAULT_STRENGTH`.
