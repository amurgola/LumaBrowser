# LineDiff

`core/shared/text/LineDiff.js`

A small line-level diff that turns two in-memory texts into hunks with context,
for showing a person what an edit did.

## Methods

- `LineDiff.diff(before, after, { context = 3, maxLines = 4000, maxHunks = 12 })`
  returns `{ added, removed, hunks, truncated }`, where each hunk is
  `{ oldStart, newStart, lines: [{ op, text }] }` and `op` is `' '`, `'-'` or
  `'+'`. Line numbers are 1-based. Returns `null` for non-string input or when
  either side has more than `maxLines` lines. Identical input returns an empty
  diff. `truncated` is true when more than `maxHunks` hunks existed.

## Why

Deliberately not a dependency: all that is needed is hunks with a little
context over text already in memory and already bounded, and an LCS over lines
is a few dozen lines. A library would add word-level refinement and patch
formats nothing renders.

The cost is quadratic in lines, so input past `maxLines` is refused: a diff of
two 50k-line files is not a card anyone reads, and computing it would block the
main process.

CRLF is normalised to LF before diffing so a line-ending change alone is not
shown as every line changing. The writer preserves the real endings; this only
affects what a reader sees.
