# EditRenderScale

`core/image-server/router/EditRenderScale.js`

Sizes the canvas a reference-image edit is rendered on for a family that
over-sharpens a picture edited at its own pixel size. Pure: no I/O.

## Methods

- `EditRenderScale.plan({ canvas, source?, scale, maxPixels?, grid? })` returns
  the render canvas `{ width, height }`, or `null` when nothing changes.
  - `canvas` is the size that was asked for; `source` is the edited picture's
    own size, or `null` when it cannot be read (the canvas then stands in,
    since an edit normally matches its source).
  - The render area is `scale * scale` times the source area, capped at
    `maxPixels`, at the canvas's aspect, each side floored to `grid`.
  - `null` when `scale` is not above 1, when the canvas already has that area
    (within `SLACK`, 2%), or when the cap leaves no room to grow.
- `SLACK` (0.98).

## Why

MiniMax-H3-Image returns a harsh, over-sharpened picture (fur, brick and skin)
when an edit is rendered at the same pixel size as the picture being edited.
Same-seed runs of one 2048x2048 picture on 2026-11-10 (RTX 5090, int8):

| reference sent | render | prompt | result |
| --- | --- | --- | --- |
| 1 MP downscale | 2048 | short | harsh |
| full 2048 | 2048 | short | harsh |
| full 2048 | 2048 | long, vendor format | harsh |
| 1 MP downscale | 3072 | short | clean |
| full 2048 | 3072 | short | clean |
| full 2048 | 4096 | long, vendor format | clean |

Only the render size relative to the source mattered. The vendor's own example
edits a 1024x1024 picture at 4096x4096, and the ComfyUI template renders edits
at 4 MP or more, so neither meets the same-size case.

[ImageRequestPlanner](ImageRequestPlanner.md) calls this for a family whose
[EditProfiles](../prompt/EditProfiles.md) entry sets `renderScale`, and
[LocalImageRun](LocalImageRun.md) scales the finished image back to the canvas
that was asked for, so callers (the chat tools' restore and compare steps
included) get the size they requested.
