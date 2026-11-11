# ImageCanvas

`core/image-server/router/ImageCanvas.js`

Canvas corrections applied before an image render.

## Methods

- `ImageCanvas.snapToQwenNative(width, height)` returns the Qwen-Image native
  size (`QWEN_NATIVE_SIZES`) nearest the requested aspect, or `null` below
  `QWEN_SNAP_MIN_AREA` (0.5 MP), for a degenerate size, or when already native.
- `ImageCanvas.alignToGrid(width, height, constraints)` aligns both sides down
  to `constraints.dimensionMultiple`, never below one cell. `null` when the grid
  is missing or 1, the size is degenerate, or nothing changes.
- `ImageCanvas.raiseToMinArea(width, height, constraints)` grows a canvas below
  `constraints.minRenderPixels` to that area at the same aspect, each side
  rounded up to the grid. `null` when the model has no floor, the size is
  degenerate, or the canvas already meets it.

## Why

Qwen-Image was trained on a fixed set of about 1.6 MP sizes; off-training sizes
such as 768x1152 give a structured texture on flat regions. Small requests
(512x512 avatars) stay small and fast. The grid alignment exists because a
caller may compute a canvas from a source image, and sd-server rejects an
off-grid size for models such as Qwen-Image 2.1 (/32). Video rows carry the same
field and are aligned by [VideoConstraints](../VideoConstraints.md). The render
floor exists for MiniMax-H3-Image, whose working range starts at 4 MP: its
official pipeline renders any smaller request at 4 MP and scales it down.
