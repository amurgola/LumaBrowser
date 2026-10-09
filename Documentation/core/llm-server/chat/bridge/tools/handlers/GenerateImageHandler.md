# GenerateImageHandler

`core/llm-server/chat/bridge/tools/handlers/GenerateImageHandler.js`

`generate_image`: renders an image and stores it as an image artifact. A
[ChatToolHandler](ChatToolHandler.md).

## Methods

- `execute(_, params, ctx)`: needs `BridgeGlobals.imageRouter()` and a
  non-empty `prompt`; `router.generate({ prompt, send })` with a
  [MediaProgressSink](../media/MediaProgressSink.md); failures through
  [MediaRenderOutcome](../media/MediaRenderOutcome.md)`.images`; stores the
  first image (title from [MediaTitle](../media/MediaTitle.md)) and returns
  `Image "<title>" is now displayed in the side panel ...`.
- `NO_SERVER`.
