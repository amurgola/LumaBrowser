# Screen

`cli/lib/tui/Screen.js`

A differential line renderer for the terminal's main screen.

## Methods

- `new Screen({ write, columns, rows })`.
- `width` (columns minus one, at least 20: the last cell never puts the terminal in pending-wrap),
  `height` (at least 4).
- `paint({ commit?, live, cursor? })`: one frame inside DEC 2026 synchronized output with the cursor
  hidden. `commit` lines are written once above the live region and scroll into the terminal's own
  scrollback (the old live region is wiped first); then only live rows from the first one that
  differs from the previous frame are rewritten, leftover rows are cleared, and the hardware cursor is
  parked at `cursor` (shown) or the last live row (hidden). A width change, or `invalidate()`, clears
  the visible screen (not the scrollback) first.
- `repaintAll({ transcript, live, cursor })`: clears screen and scrollback and writes everything; used
  after a resize, when the terminal has re-wrapped old rows and nothing can be located.
- `finish()`: leaves the live region and puts the cursor on a fresh line below it.
- `clearLive()`, `invalidate()`.
- `Screen.emitLine(line)`: tabs expanded to their measured cells, open styles sealed.
- Fields: `prevLive`, `cursorRow`, `cursorShown`, `paints`.

## Why

Callers keep every line within `width` and the live region on screen; nothing here re-wraps. A raw
tab must never reach the terminal (it jumps to the next 8-column stop and breaks the row count), so
every line goes through `emitLine`.
