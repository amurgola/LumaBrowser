# ResultList

`core/llm-server/chat/web-tools/ResultList.js`

The rows of one web search, merged across engines without repeats.

## Methods

- `new ResultList(limit = SearchEngine.RESULT_LIMIT)`.
- `add(rows)`: appends rows whose page ([UrlIdentity](UrlIdentity.md)) is not
  listed yet, up to the limit; returns how many were new.
- `size()`, `rows()` (a copy).
- `reply(query)`: `LookupReply.ok` with `results` (the rows) and a message:
  `Search results for "<q>" (searched <date>):`, numbered rows (title, URL,
  snippet when present), then `GUIDE`.

## Why

When a thin list is topped up from a second engine, the same page often comes
back with a different URL spelling; listing it twice would waste a number. The
guide says snippets may be stale, to open results by number rather than
retyping, and how to use `find` and `part`.
