# EditImageHandler

`core/llm-server/chat/bridge/tools/handlers/EditImageHandler.js`

`edit_image`: edits an image artifact and saves the next version of its chain.
A [ChatToolHandler](ChatToolHandler.md).

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
- `NO_SERVER`, `NO_ARTIFACT`, `DEFAULT_STRENGTH`.
