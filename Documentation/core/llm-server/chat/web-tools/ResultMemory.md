# ResultMemory

`core/llm-server/chat/web-tools/ResultMemory.js`

Remembers one run's web search results.

## Methods

- `remember(rows)`: rows with a URL become the latest search (they own the
  numbers) and join the near-match pool. An empty list changes nothing.
- `byNumber(n)`: `{ title, url }` of row `n` (1-based) of the latest search, or `null`.
- `count()`: rows in the latest search.
- `nearest(url)`: `{ title, url, similarity }` of the closest pooled URL by
  [EditDistance](EditDistance.md) over [UrlIdentity](UrlIdentity.md) keys, or `null`.
- `NEAR_MATCH_POOL` (40).

## Why

Opening a result by number avoids retyping long URLs, which local models
mangle. The pool spans every search in the run because a retyped URL is often
from an earlier one; 40 rows is about seven searches, and older rows are rarely
what a model retypes. Duplicates (by UrlIdentity) are pooled once.
