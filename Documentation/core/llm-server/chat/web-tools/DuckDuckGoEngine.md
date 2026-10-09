# DuckDuckGoEngine

`core/llm-server/chat/web-tools/DuckDuckGoEngine.js`

DuckDuckGo's HTML results endpoint, the first engine `web_search` tries (in a
browser tab, then headless). Extends [SearchEngine](SearchEngine.md).

## Methods (static)

- `searchUrl(query)`: `https://html.duckduckgo.com/html/?q=<encoded>`.
- `parse(html, limit)`: rows from `<a class="result__a">` anchors; the next
  `result__snippet` anchor fills the snippet of the row before it. Links that
  unwrap to `duckduckgo.com` (ads, `y.js` redirects) are dropped.
- `unwrapHref(href)`: decodes the `//duckduckgo.com/l/?uddg=<encoded>` wrapper
  (protocol-relative links get `https:`); a link without one, or one that fails
  to decode, is returned as is.
- `RESULTS_URL`, `TAB_NEEDLE` (`result__a`, whose appearance in a tab means the
  results rendered).

## Why

Anchors and snippets are scanned together in document order. The old parser
paired two separate index lists, so every snippet after a skipped anchor (an
ad, a non-http link) shifted onto the wrong result.
