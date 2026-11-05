# MediaDetails

`core/llm-server/ui/js/chat/panel/media/MediaDetails.js`

What the viewer's details strip says about one image or video: the `render`
details the artifact carries
([MediaRenderInfo](../../../../../chat/bridge/tools/media/MediaRenderInfo.md))
or, for media made before those were recorded, the prompt of the
`generate_image` / `edit_image` / `generate_video` / `animate_image` call that
made it (matched by the artifact's place among the turn's media).

## Methods

- `MediaDetails.of(item)`: `{ prompt, meta, render }`.
- `MediaDetails.meta(render)`: the chips, e.g. `qwen-image`, `1024 × 768`,
  `seed 42`, `20 steps`, `cfg 2.5`, `euler / simple`, `16 fps`, `81 frames`.
