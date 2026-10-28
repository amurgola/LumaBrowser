# RegionPainter

`core/llm-server/ui/js/chat/region/RegionPainter.js`

The paint layer of the region editor: a canvas at the image's pixel size that
the user brushes a translucent colour onto (or erases), with a brush size, an
undo stack of snapshots, and pointer-to-image coordinate mapping.

## Methods

- `new RegionPainter({ canvas, width, height })`: sizes the canvas in image
  pixels; the brush starts at `defaultSize` (a twentieth of the longer side,
  clamped to `MIN_SIZE`..`MAX_SIZE`, 4..400).
- `setTool('brush' | 'eraser')`, `setSize(px)`, `tool`, `size`, `width`,
  `height`, `canUndo`.
- `pointToImage(event)`: client coordinates to image pixels through the
  canvas's displayed rectangle.
- `begin(point)`, `move(point)`, `end()`: one stroke is one undo step; a dot
  is a stroke that never moved. The eraser draws with `destination-out`.
- `undo()`, `clear()` (an undo step too), `imageData()`, `isBlank()`,
  `coverage()`.
- `loadMask(image)`: an earlier white-on-black mask back into paint.
- `RegionPainter.PAINT_RGBA`, `MAX_UNDO` (25).
