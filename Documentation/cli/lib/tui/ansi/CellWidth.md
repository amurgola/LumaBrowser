# CellWidth

`cli/lib/tui/ansi/CellWidth.js`

Terminal cell widths, the one measure every painted line goes through.

## Methods (static)

- `CellWidth.visible(str)`: escapes are 0, wide CJK, Hangul, fullwidth forms and most emoji 2,
  combining marks, ZWJ, variation selectors and skin-tone modifiers 0, control chars 0, a tab `TAB` (3).
- `CellWidth.charWidth(codePoint)`, `CellWidth.isWide(codePoint)`.
- `CellWidth.expandTabs(str)`: each tab becomes `TAB` spaces.
- `WIDE_RANGES`, `ZERO_RANGES`, `TAB`.

## Why

A raw tab jumps to the next 8-column stop, so a line padded to exactly the width overruns, wraps, and
the differential painter's row bookkeeping drifts (seen live with tab-indented GDScript in the thinking
preview). Expanding to the measured cells keeps measuring and painting in agreement.
