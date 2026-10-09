# SearchEngine

`core/llm-server/chat/web-tools/SearchEngine.js`

Base class for the HTML search engines the `web_search` tool scrapes. Engines
are used through static methods.

## Methods (static)

- `searchUrl(query)` (abstract) returns the results-page URL.
- `parse(html, limit = RESULT_LIMIT)` (abstract) returns
  `[{ title, url, snippet }]`: at most `limit` rows, only `http(s)` links, none
  on the engine's own site, no untitled rows. Null input gives `[]`.
- `stripTags(html)` turns a fragment into plain text (tags removed, entities
  decoded, whitespace collapsed).
- `RESULT_LIMIT` (6): six rows fit in about 500 tokens and leave spares when
  the top results turn out blocked or stale.
- Protected helpers: `_attr(attrs, name)`, `_isHttp(url)`, `_isOnDomain(url, domain)`
  (unparseable URLs count as on the domain, so they are dropped).

Unimplemented methods throw `<Class>.<method> is not implemented`.

## Implementations

- [DuckDuckGoEngine](DuckDuckGoEngine.md)
- [BingEngine](BingEngine.md)

## Why

[SearchRunner](SearchRunner.md) tries the engines in turn with the same calls,
so a third engine is one more subclass and one more entry in its ladder.
