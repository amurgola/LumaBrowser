# VideoHandler

`core/llm-server/chat/bridge/tools/handlers/VideoHandler.js`

`generate_video` and `animate_image`: renders a clip and stores it as a video
artifact. A [ChatToolHandler](ChatToolHandler.md).

## Methods

- `execute(tool, params, ctx)`: needs `BridgeGlobals.videoRouter()` and a
  `prompt`; for `animate_image` the source image is the first frame and an
  optional `endArtifactId`/`lastArtifactId` image the last;
  `router.generate({ prompt, firstFrame, lastFrame, durationSec, send })`;
  failures through [MediaRenderOutcome](../media/MediaRenderOutcome.md)`.video`;
  always a new artifact (a chain's kind is fixed).
- `NO_SERVER`, `NO_ARTIFACT`.
