# QueryResemblance

`core/llm-server/chat/tool-loop/QueryResemblance.js`

How alike two search queries are.

## Methods

- `QueryResemblance.between(a, b)`: Jaccard overlap (0..1) of the two
  `words` sets. If either set is empty, it compares the trimmed lowercase
  texts instead.
- `QueryResemblance.words(text)`: lowercase letter/number runs, minus
  `FILLER` words, with a plural `s` stripped from words over four letters.

## Why

A reworded query (`weather in Paris today` / `paris weather today`) gets the
same results from a search engine. Token-set overlap is cheap, needs no model,
and ignores word order. Stemming is deliberately minimal (`news` must not become
`new`).
