# QueryTermExtractor

`core/rag/QueryTermExtractor.js`

Turns free query text into search terms.

## Methods

- `QueryTermExtractor.extract(query)` returns `[{ word, stem, prefix }]` in
  query order:
  1. distinct folded words ([WordTokenizer](WordTokenizer.md));
  2. English function words (`FUNCTION_WORDS`: "the", "how", "what", ...)
     dropped, unless that would leave nothing;
  3. over `TERM_BUDGET` (16) words, the longest 16 kept (query order kept);
  4. words of `MIN_STEM_LENGTH` (4) or more get `prefix: true` and a stem with
     the first of `SUFFIXES` (`ing`, `ed`, `es`, `s`) removed when the stem keeps
     at least 4 characters; shorter words match exactly;
  5. terms sharing a stem collapse into the first.

## Why

- **Function words** match nearly every chunk; dropping them stops "how does
  the cache work" from ranking on "the".
- **Stem prefixes** give cheap inflection recall: "chloroplasts" searches
  `chloroplast*` and finds "chloroplast"; "embedding" searches `embedd*` and
  finds "embedded". Four characters is the shortest stem that is still
  selective; shorter prefixes (`ca*`) match too much, so short words (ids,
  acronyms such as "api") stay exact. FTS5 runs prefix queries without a prefix
  index (a range scan), so the schema needs no change.
- **Budget 16, longest first.** The docs pre-pass sends up to 2000 characters
  of a user message. Sixteen content words is a long question; past that, extra
  OR branches add noise and cost. Word length is a free stand-in for rarity
  (high IDF) without a corpus lookup.
