# PointerDrag

`core/on-demand/ui/PointerDrag.js`

Drags the view by a handle; under 4 px of movement is a click.

## Methods

- `new PointerDrag(handle, { onDrag, onDragEnd, onClick }, win)`, `attach()`.
  Primary button only, not on a nested button; moves are summed per animation
  frame; `body.dragging` while dragging.
