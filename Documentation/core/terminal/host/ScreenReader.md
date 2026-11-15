# ScreenReader

`core/terminal/host/ScreenReader.js`

Reads a terminal's screen and scrollback as plain text, the way a person sees it: escape sequences already applied,
wrapped rows joined into one line, trailing spaces and trailing blank lines dropped. Also places marks that keep their
line as the scrollback moves.

## Methods

- `new ScreenReader(term)`, `mark()`, `cursor()`, `screen()`, `tail(lines)`, `from(mark)` (from the top when the
  mark's line has scrolled out).
- Static `clip(text, maxChars)`: keeps a quarter of the budget from the start and the rest from the end, with a line
  saying how much was cut.
