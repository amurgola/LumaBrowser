# EditorView

`cli/lib/tui/editor/EditorView.js`

Draws the [Editor](Editor.md) as a message box across the full width.

## Methods (static)

- `EditorView.render(editor, width)` returns `{ lines, cursor: { row, col } }`:
  - top edge with the label (`╭─ reviewer ───╮`), bottom edge, `│` sides; accent while idle, border
    colour while busy; ASCII corners with an ASCII theme;
  - empty: the prompt glyph and the placeholder, or the dimmed suggestion with `tab to use` on the right;
  - text: each logical line wrapped ([PlainWrap](PlainWrap.md)), the prompt glyph on the first row;
    the cursor lands on the row and column that hold it;
  - with the palette open: up to `PALETTE_ROWS` (12) entries under the input, the highlighted one
    marked `›`, help aligned after the names, then `+N more`.
  Every line is exactly `width` cells.
