# RegionEditor

`core/llm-server/ui/js/chat/region/RegionEditor.js`

The "mark an area to edit" dialog: the image with a paint layer over it, brush
and eraser with a size slider, undo and clear, a note on what should change
there, and Edit now / Add to message / Cancel. The same pattern as
Midjourney's editor, Photoshop's generative fill selection and ComfyUI's mask
editor, reduced to what a chat needs.

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

Add to message is enabled once something is painted (it reads "Remove area"
when an existing region was cleared) and leaves the area as a chip in the
composer. Edit now, the primary button, needs a note as well, since the note
is what gets sent: the staging sends the turn at once. Enter in the note field
is Edit now when there is a note and Add to message otherwise. The coverage
readout shows the marked share. Pointer events cover mouse, pen and touch,
with pointer capture so a fast stroke that leaves the canvas continues.

## Why

Marking an area and writing what should change there is the whole request;
making the user find Send afterwards read as the area having been "attached"
rather than acted on. Add to message stays for the cases where the note is
only part of a longer message or several areas go out together.
