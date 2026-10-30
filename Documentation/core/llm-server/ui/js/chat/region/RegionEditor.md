# RegionEditor

`core/llm-server/ui/js/chat/region/RegionEditor.js`

The "mark an area to edit" dialog: the image in a zoomable viewport
([RegionViewport](RegionViewport.md)) with a paint layer over it
([RegionPainter](RegionPainter.md)), brush, eraser, rectangle and fill tools
with a size slider and readout, a guide layer ([RegionOverlay](RegionOverlay.md))
that shows the brush as a ring before the click and the dashed box of the
close-up the model will be given ([RegionContextBox](RegionContextBox.md)),
undo, invert and clear, a note on what should change there, and Edit now /
Add to message / Cancel. The same pattern as ComfyUI's mask editor and Krita's
selection, reduced to what a chat needs.

## Methods

- `RegionEditor.supported()`: false where the page has no 2D canvas (jsdom),
  so the staging can say so instead of opening.
- `open({ dataUrl, title, existing })`: resolves
  `{ mask (base64 PNG, white = change, at the image's pixel size), note,
  coverage, width, height, preview (a JPEG data URL of the image with the
  paint over it, 320 wide) }`, the same with `send: true` for Edit now,
  `{ removed: true }` when an existing region was cleared and used, or null
  when cancelled (Esc, the overlay, Cancel, the x). An `existing`
  `{ mask, note }` is loaded back into the paint layer and the note field.
- `isOpen()`.
- `RegionEditor.contextText(context)`: the readout under the tools, "Edits a
  512x512 close-up around the area (the dashed box)" or "Edits the whole
  image".

## Interaction

- Tools: Brush (B), Eraser (E), Rectangle (R: drag a box), Fill (F: click
  inside an outline to fill the pocket). The size slider and its pixel readout
  apply to brush and eraser; `[` and `]` or Alt+wheel nudge the size.
- View: the wheel zooms about the pointer (1x to 8x), Space-drag or the middle
  button pans, `0` or the "Fit · 240%" button (shown while zoomed) resets.
- Guides: a ring under the pointer at the brush's on-screen size (dashed for
  the eraser, with a crosshair when tiny), the rectangle being dragged, and
  the dashed close-up box, redrawn after every stroke, zoom or resize.
- Undo (Ctrl+Z, one step per stroke, rectangle, fill, invert or clear),
  Invert (I), Clear.
- Keys act on the picture only while the note field does not have focus; Esc
  closes from anywhere.

Add to message is enabled once something is painted (it reads "Remove area"
when an existing region was cleared) and leaves the area as a chip in the
composer. Edit now, the primary button, needs a note as well, since the note
is what gets sent: the staging sends the turn at once. Enter in the note field
is Edit now when there is a note and Add to message otherwise. The coverage
readout shows the marked share; the measure is cached per change, so typing
in the note no longer rescans the canvas.

## Why

Marking an area and writing what should change there is the whole request;
making the user find Send afterwards read as the area having been "attached"
rather than acted on. The guides exist because the first version gave no hint
of a stroke's size before it landed and no hint of what the model would be
shown; the zoom because a tall image in a fixed box put a small brush under a
screen pixel.
