# PaletteMatcher

`core/palette/PaletteMatcher.js`

Scores how well a typed query matches an item's text fields (a setting's label,
keywords, path and description; a tab's title and address; a command's name).
Word based and forgiving, all static.

## Methods

- `score(query, fields)`: `fields` is `[{ text, weight }]` with the label first.
  Returns `{ score, marks }`, or null below `MIN_SCORE` (0.3). Each query word
  takes its best weighted match over the fields: exact word 1, same stem 0.95,
  word prefix up to 0.85, one typo 0.6 (query words of 5 or more letters),
  substring 0.45. The mean is scaled by coverage (how many query words matched),
  and the whole query inside the label adds a phrase bonus (equal 0.6, prefix
  0.4, contained 0.25).
- `queryWords(query)`: unique words with `FILLER` ("how", "do", "I", "the",
  "change", "turn"...) dropped, unless the query is nothing but filler.
- `words(text)`, `fold(text)`: lowercased, accents folded, split on anything that
  is not a letter or digit.
- `stem(word)`: strips `ing`, `es`, `ed` or `s` when 4 letters remain.
- `withinOneEdit(a, b)`: one insert, delete, substitution or swap of neighbouring
  letters ("lenght").
- `marks(qWords, label)`: `[start, end)` ranges where a query word starts a label
  word, for highlighting; none when folding changed the label's length.

## Why

People type what they want, not the label ("how do I make links open here",
"context lenght"). Dropping filler and accepting prefixes, stems and one typo
finds the row; the phrase bonus keeps a near exact label match on top.
