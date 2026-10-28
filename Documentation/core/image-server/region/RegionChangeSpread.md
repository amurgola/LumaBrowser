# RegionChangeSpread

`core/image-server/region/RegionChangeSpread.js`

Lets the blend mask follow the model: where the render differs strongly from
the source right next to the painted area, that stretch is taken from the
render too, so a head redrawn a little lower does not leave the old mouth
showing through the new chin. Bounded: only pixels connected to the painted
area through other changed pixels, and only so far from it.

## Methods (all static)

- `changed(source, output, threshold = THRESHOLD)`: a binary mask, 255 where
  the two bitmaps (one size, 4 bytes per pixel) differ by more than
  `threshold` (48) in any colour channel. Below that a pixel counts as "the
  same picture" (a resampled edge, a slight tone shift).
- `spread(grown, changed, cap)`: `grown` (the dilated binary painted mask) plus
  every changed pixel reachable from it through changed pixels within `cap`
  4-neighbour steps. A breadth-first walk with a distance per pixel; an island
  of change elsewhere in the picture never joins.
- `capPx(width, height)`: `CAP_SHARE` (8%) of the longer side, 12..120 px.

## Why

Instruction edit models take no mask and never reproduce the source pixel for
pixel: the object they redraw shifts and resizes a little. A composite that
cuts exactly at the painted edge then shows both drawings at once along it (the
"face fades into the body" look). Growing the painted mask blindly would let
the model's unrelated drift in everywhere; following only strong, connected
changes near the area takes the redrawn object whole and nothing else. The cap
keeps a model that changed too much from swallowing the picture.
