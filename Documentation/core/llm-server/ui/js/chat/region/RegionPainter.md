# RegionPainter

`core/llm-server/ui/js/chat/region/RegionPainter.js`

The paint layer of the region editor: a canvas at the image's pixel size that
the user brushes a translucent colour onto (or erases), fills a rectangle on,
floods an enclosed pocket of, or inverts, with a brush size, an undo stack of
snapshots, a cached measure of what is painted, and pointer-to-image
coordinate mapping.

## Methods

- `new RegionPainter({ canvas, width, height })`: sizes the canvas in image
  pixels; the brush starts at `defaultSize` (a twentieth of the longer side,
  clamped to `MIN_SIZE`..`MAX_SIZE`, 4..400).
- `setTool('brush' | 'eraser' | 'rect' | 'fill')`, `setSize(px)`,
  `nudgeSize(direction)` (a `SIZE_STEP` of 1.25 up or down, at least a
  pixel), `tool`, `size`, `sized` (brush or eraser), `width`, `height`,
  `canUndo`.
- `pointToImage(event)`: client coordinates to image pixels through the
  canvas's displayed rectangle.
- `begin(point)`, `move(point)`, `end()`: one stroke is one undo step; a dot
  is a stroke that never moved. The eraser draws with `destination-out`.
- `rect(from, to)`: paints the rectangle between two image points (false for
  a degenerate one). `fill(point)`: floods the unpainted pocket under the
  point through [RegionFill](RegionFill.md) (false when nothing was painted).
  `invert()`.
- `undo()`, `clear()` (an undo step too), `imageData()`, `measure()`
  (`{ coverage, bounds }`, cached until the next change), `isBlank()`,
  `coverage()`, `bounds()`.
- `loadMask(image)`: an earlier white-on-black mask back into paint.
- `RegionPainter.PAINT_RGBA`, `MAX_UNDO` (25), `TOOLS`.
