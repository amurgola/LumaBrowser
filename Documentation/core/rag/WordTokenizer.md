# WordTokenizer

`core/rag/WordTokenizer.js`

Splits text into the words knowledge-base retrieval compares.

## Methods

- `WordTokenizer.words(text)` returns `[{ text, folded, start, end }]` for each
  run of Unicode letters, digits and marks, in text order. Punctuation and
  underscores split words; runs with no letter or digit are skipped.
- `WordTokenizer.fold(word)` lowercases and removes accents decomposed off a
  Latin letter (`Café` -> `cafe`); marks of other scripts stay. `''` when
  nothing searchable is left.
- `WordTokenizer.foldedSet(text)` is the distinct folded words.

## Why

One tokenizer serves query terms ([QueryTermExtractor](QueryTermExtractor.md)),
match spans ([TermMatcher](TermMatcher.md)) and passage overlap
([PassageSimilarity](PassageSimilarity.md)), and it mirrors SQLite FTS5's
default `unicode61` tokenizer (letters and digits are token characters, Latin
diacritics removed), so what the UI highlights is what FTS5 matched.
