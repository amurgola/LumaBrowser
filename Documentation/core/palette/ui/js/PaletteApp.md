# PaletteApp

`core/palette/ui/js/PaletteApp.js`

The search palette page: the input, live results (recent places when the box is
empty), keyboard and mouse selection, and the switch into "Dig deeper"
([DigView](DigView.md)).

## Methods

- `new PaletteApp({ api = window.paletteAPI, doc = document })`.
- `start()`: subscribes to `onShow` (clears the box, shows or hides the private
  badge, focuses and searches), `onHidden` and `onDigEvent`, and wires the input,
  keys, scrim and list.

## Keys

- Typing searches after a 50 ms debounce; a late answer to an older query is
  dropped. Typing while digging leaves the dig.
- Up and Down move through every row across groups (wrapping); Enter opens the
  active row; the mouse hovers and clicks the same rows.
- Tab (with text in the box), or choosing the last row, enters Dig deeper.
- Escape steps back: out of the dig, then clears the query, then closes.
- Shift tapped twice (no other key between, within 400 ms, each press shorter than
  350 ms and without Ctrl, Alt or Meta, the same rules as main's detector) closes
  the palette, as it opened. The page does this itself because main's detector does not watch the
  palette's own view.
