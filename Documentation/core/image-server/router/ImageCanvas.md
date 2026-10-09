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

## Why

Qwen-Image was trained on a fixed set of about 1.6 MP sizes; off-training sizes
such as 768x1152 give a structured texture on flat regions. Small requests
(512x512 avatars) stay small and fast. The grid alignment exists because a
caller may compute a canvas from a source image, and sd-server rejects an
off-grid size for models such as Qwen-Image 2.1 (/32). Video rows carry the same
field and are aligned by [VideoConstraints](../VideoConstraints.md).
