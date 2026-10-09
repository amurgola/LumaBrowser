# DesktopDrag

`core/desktop/service/DesktopDrag.js`

`desktop_drag` with real input, after the window is resolved.

## Methods

- `new DesktopDrag(parts)`.
- `drag(w, { from, to, button = 'left', steps = 15, durationMs = 300 })` never
  throws. Ends are `{ ref }` or screenshot `{ x, y }` ([RefLocator](RefLocator.md)),
  both inside the window. Steps are clamped to 2-60, duration to 50-3000 ms.
  After the refusals and human check it moves to `from`, presses (40 ms settle,
  then 80 ms held: many apps start a drag only after the button has been down a
  moment), glides in SetCursorPos steps re-checking the foreground every step,
  waits 60 ms (drop targets update on the last move), and releases.
  `{ method: 'drag', from, to, steps, ms }`.

Apps and OLE drag-and-drop need the intermediate moves to pass the drag
threshold and track drop targets. However it ends, a held button is released and
the cursor restored.
