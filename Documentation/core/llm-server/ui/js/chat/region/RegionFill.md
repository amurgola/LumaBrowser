# RegionFill

`core/llm-server/ui/js/chat/region/RegionFill.js`

Whole-area operations on the region editor's paint ImageData, in place: the
flood fill under a click, the invert, and one pass that measures coverage and
bounds together.

## Methods (all static)

- `flood(imageData, x, y, rgba)`: paints every unpainted pixel reachable from
  `(x, y)` through unpainted pixels (4-neighbour), bounded by paint and the
  image edge. Returns the count painted; 0 for a start outside the image or on
  paint. A click inside an outline the brush drew fills the pocket; a click
  outside floods the background up to the outline.
- `invert(imageData, rgba)`: painted pixels become clear and clear pixels take
  the paint.
- `measure(imageData)`: `{ coverage, bounds }` in one scan, the same numbers
  as [RegionMaskData](RegionMaskData.md)'s `coverage` and `bounds`.

## Why

Outlining an object and filling it is the fast way to mark a shape; the brush
alone makes the user scrub the inside. The single-pass measure exists because
the editor refreshes on every keystroke in the note, and two full scans of a
megapixel canvas per character were the one avoidable cost in the dialog.
