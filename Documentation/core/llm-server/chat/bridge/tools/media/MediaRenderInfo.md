# MediaRenderInfo

`core/llm-server/chat/bridge/tools/media/MediaRenderInfo.js`

The render details a media artifact carries into the chat: tool, prompt
(clipped to 4000 characters), model, seed, width, height, steps, cfg, sampler,
scheduler, fps and frame count, empty fields dropped. `generate_image`,
`edit_image`, `generate_video` and `animate_image` publish a copy of the saved
artifact with these under `render`, so the live artifact event and the
persisted turn trace both have them for the panel's
[MediaDetails](../../../../ui/js/chat/panel/media/MediaDetails.md). The store
row and the tool result the model reads are unchanged.

## Methods

- `MediaRenderInfo.from({ tool, prompt, media, result })`: `media` is the image
  or video the router returned, `result` its resolve (`modelId`, `settings`).
- `MediaRenderInfo.attach(artifact, render)`: a copy with `render`, or the
  artifact itself when there is nothing to add.
