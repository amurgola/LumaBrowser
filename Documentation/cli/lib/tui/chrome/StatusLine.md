# StatusLine

`cli/lib/tui/chrome/StatusLine.js`

The status line under the transcript while a turn runs, and the two-ended line layout.

## Methods (static)

- `StatusLine.render({ spinner, text, secs, hint }, width, theme)`: `  <spinner> <text> · <whole seconds>`
  (seconds from 1 s on) with the hint right-aligned.
- `StatusLine.joinEnds(left, right, width)`: left and right on one line. A right side that cannot fit
  with 8 cells to spare is dropped; otherwise the left side is shortened first, because the right side
  (hints, token count) is the useful part. Also used for the footer.
