# ExcerptWindow

`core/rag/ExcerptWindow.js`

Cuts a short, highlighted preview of a passage for the sources UI.

## Methods

- `ExcerptWindow.cut(text, spans)` returns `{ text, marks }`. `spans` are match
  ranges in the passage ([TermMatcher](TermMatcher.md)`.spans`).
  - Passages up to `WIDTH` (280) characters are shown whole.
  - Longer ones: each match is tried as an anchor `LEAD` (60) characters into
    the window; the window covering the most matches wins (the opening of the
    passage when there are none). Edges snap to word boundaries unless that
    would move them more than `LEAD`; clipped edges get `ELLIPSIS` (`...`).
  - Whitespace runs collapse to one space.
  - `marks` are `[start, end)` ranges into the excerpt `text`.

## Why

Highlight ranges instead of `<b>` markup let the UI build DOM nodes from plain
text, so a passage can never inject HTML. 280 characters is about three lines
of a narrow sources panel, roughly fifty words: enough to recognise a passage
without opening it. A 60-character lead gives the first highlight a few words
of context.
