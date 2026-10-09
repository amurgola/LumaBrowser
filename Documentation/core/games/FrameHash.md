# FrameHash

`core/games/FrameHash.js`

Perceptual frame signatures for game mode. Frames are `{ width, height, bgra }`
top-down BGRA buffers. Pure functions; capture lives in GameController.

## Methods

- `FrameHash.dHash(shot, { w = 32, h = 18 } = {})` difference hash as hex
  (`w * h` bits, 144 chars by default). Bit (x, y) is 1 when that cell is darker
  than its right neighbour by more than 0.5.
- `FrameHash.colorGrid(shot, { w = 16, h = 9 } = {})` coarse colour grid as hex:
  3 chars (R, G, B levels 0-7) per cell.
- `FrameHash.frameSignature(shot)` `"<dHash>.<colorGrid>"`, the value game mode compares.
- `FrameHash.hamming(a, b)` differing dHash bits, plus 4 per changed colour cell
  when both sides are full signatures. A cell has changed when any channel moved
  2+ levels. Throws on non-strings or hashes of different lengths.
- `FrameHash.downscaleGray(shot, w, h)` area-averaged Rec. 601 luma grid (Float64Array).
- Statics: `GRID_W`, `GRID_H`, `COLOR_W`, `COLOR_H`, `DEAD_BAND`,
  `COLOR_MIN_LEVELS`, `COLOR_CELL_WEIGHT`, `SAMPLES_PER_CELL`.

Both grids sample with a stride of about 8 samples per cell along the shorter
axis, so a 4K frame costs a few milliseconds instead of ~8M reads.

## Why

A vision call costs about 0.8 s per look, so the agent cannot watch a game
frame by frame. A hash answers what the loop needs between looks: "did my input
do anything?", "has the animation settled?", "have I been staring at the same
screen for five turns?". Harnesses that played long games (Pokemon,
Zelda-likes) leaned on exactly this screen-change signal.

dHash compares neighbours, so it ignores global brightness shifts but flips
bits wherever structure moves. It is blind to recolouring, though: a card
turning from blue to green keeps every brightness relation (measured live: a
played card in the e2e card game scored distance 0). Games signal state with
colour constantly, hence the colour grid. Its weight of 4 per cell makes one
recoloured card-sized region clear the default `waitForChange` threshold of 8,
while capture noise and compression shimmer stay inside one level.
