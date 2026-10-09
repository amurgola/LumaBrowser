# EditDistance

`core/llm-server/chat/web-tools/EditDistance.js`

Levenshtein edit distance between two short strings.

## Methods (all static)

- `levenshtein(a, b)`: insertions, deletions and substitutions to turn `a` into
  `b`. Inputs are stringified and capped at `MAX_CHARS` (300) each.
- `similarity(a, b)`: `1 - distance / max(len(a), len(b), 1)`, so 1 for
  identical strings.

## Why

Used by [ResultMemory](ResultMemory.md) to snap a mistyped URL to a remembered search
result. The cap keeps the quadratic table small: these are URLs, not documents.
