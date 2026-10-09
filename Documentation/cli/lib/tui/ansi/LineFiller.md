# LineFiller

`cli/lib/tui/ansi/LineFiller.js`

Packs the tokens of one logical line into rows for [AnsiWrap](AnsiWrap.md); one instance per line.

## Methods

- `new LineFiller(width, sgrState)`; `fill(tokens)` returns the rows. A space token at a break is
  dropped, trailing spaces are trimmed from a finished row, and a token wider than the line is cut.
- `LineFiller.breakLong(token, width, sgrState)`: a long token cut into rows of `width` cells.
