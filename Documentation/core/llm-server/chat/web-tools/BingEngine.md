# BingEngine

`core/llm-server/chat/web-tools/BingEngine.js`

Bing's results page, the fallback engine when DuckDuckGo blocks or its markup
changes. Extends [SearchEngine](SearchEngine.md).

## Methods (static)

- `searchUrl(query)`: `https://www.bing.com/search?q=<encoded>`.
- `parse(html, limit)`: one row per `<li class="b_algo">` block, title and link
  from its `<h2><a href>`, snippet from its first `<p>`. Relative links are made
  absolute on `www.bing.com`, then decoded; links still on `bing.com` are dropped.
- `decodeHref(href)`: decodes `/ck/a?...&u=a1<base64url>` to the target when
  that is an `http(s)` URL; otherwise returns the href unchanged.
- `RESULTS_URL`.
